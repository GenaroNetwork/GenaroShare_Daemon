#!/usr/bin/env node

'use strict';

require('./globalsetting');

const config = require('../lib/config/daemon');
const blindfold = require('blindfold');
const editor = require('editor');
const {homedir} = require('os');
const fs = require('fs');
const storj = require('storj-lib');
const path = require('path');
const mkdirp = require('mkdirp');
const stripJsonComments = require('strip-json-comments');
const genaroshare_create = require('commander');
const {execSync} = require('child_process');
const utils = require('../lib/utils');
const touch = require('touch');

const bip39 = require('bip39');

var Promise = require('bluebird').Promise;
var jsonfile = Promise.promisifyAll(require('jsonfile'));
var keystore = require('eth-lightwallet').keystore;
var afs = Promise.promisifyAll(require("fs"));
var paymentAddress;

var prompt = require('prompt');


function createFile(filename) {
  fs.writeFile(filename, '{}', function(err) {
      if(err) {
          console.log(err);
      }
      console.log("Json file was saved!");
  });
} 

var KeyPath = path.join(homedir(),'.config/genaroshare/keystore/keys.json');

if(!fs.existsSync(KeyPath)){
      fs.mkdir(path.join(homedir(),'.config/genaroshare/keystore'),function(e){
        if(!e || (e && e.code === 'EEXIST')){
          fs.writeFileSync(KeyPath,'{}');
          var keys = JSON.parse(fs.readFileSync(KeyPath));          
        }else{
          console.log(e);
        }
      })
      
  }else{
    var keys = JSON.parse(fs.readFileSync(KeyPath));   
  }



const defaultConfig = JSON.parse(stripJsonComments(fs.readFileSync(
  path.join(__dirname, '../example/farmer.config.json')
).toString()));


function whichEditor() {

  const editors = ['vi', 'nano'];

  function checkIsInstalled(editor) {
    try {
      execSync('which ' + editor);
    } catch (err) {
      return false;
    }

    return true;
  }

  for (let i = 0; i < editors.length; i++) {
    if (checkIsInstalled(editors[i])) {
      return editors[i];
    }
  }

  return null;
}

/**
  * Utility Functions
  */

 function createKeystore(_password, _seed) {
  return new Promise(function(resolve, reject) {
    var seed = '';
    if(_seed) {
      seed = _seed;
    }
    else {
      seed = bip39.generateMnemonic();
      console.log('THIS IS YOUR MNEMONIC, PLEASE WRITE DOWN. THIS WILL ONLY SHOW ONCE:')
      console.log(seed)
      console.log('\nyou can import this mnemonic into other wallet software which supports BIP39. Such as genaro eden, myetherwallet, imtoken.')
    }
    var password = Buffer(_password).toString('hex');
    keystore.createVault({ password: password ,seedPhrase: seed,hdPathString: "m/44'/60'/0'/0"}, function(error, ks) {
      if (error) { reject(error); }
      ks.keyFromPassword(password, function(error, dKey) {
        if (error) { reject(error); }
        ks.generateNewAddress(dKey, 1);
        var address = `${ks.getAddresses()[0]}`;        
        var keystore = JSON.parse(ks.serialize());
        let pk = ks.exportPrivateKey(address, dKey)
        console.log('\nTHIS IS YOUR WALLET ADDR AND PRIVATE KEY, PLEASE WRITE DOWN. THIS WILL ONLY SHOW ONCE!')
        console.log('wallet address: ' + address)
        console.log('private key: 0x' + pk)
        console.log('\nyou can import this key into other wallet software')
        resolve({address, keystore})
      });
    });
  });
}

function saveProfile(name, keystore, address) {
  return new Promise((resolve, reject) => {
    jsonfile.readFileAsync(KeyPath, {throws: false})
    .then(function(PROFILES) {
      var profiles = PROFILES || {};
      profiles[`${name}`] = {
        keystore,
        address
      };
      return profiles;
    })
    .then(function(_profiles) {
      return jsonfile.writeFileAsync(KeyPath, _profiles, {spaces: 2});
    })
    .then(function() { resolve(true); })
    .catch(function(error) { reject(error); });
  })
} 

// name could be set to default or write by user
  function create_new_address(name,password){
        createKeystore(password)
        .then(function(ks) {
          paymentAddress = ks.address;
          return saveProfile(name, ks.keystore, ks.address); })
        .then(function(saved) { console.log('saved', saved); })
        .catch(function(error) { console.log(error); }); 
  }

genaroshare_create
  .description('generates a new node configuration')
  .option('--name <name>', 'specify the account name(required)')
  .option('--key <privkey>', 'specify the private key')
  .option('--storage <path>', 'specify the storage path')
  .option('--size <maxsize>', 'specify node size (ex: 10GB, 1TB)')
  .option('--rpcport <port>', 'specify the rpc port number')
  .option('--rpcaddress <addr>', 'specify the rpc address')
  .option('--maxtunnels <tunnels>', 'specify the max tunnels')
  .option('--tunnelportmin <port>', 'specify min gateway port')
  .option('--tunnelportmax <port>', 'specify max gateway port')
  .option('--manualforwarding', 'do not use nat traversal strategies')
  .option('--verbosity <verbosity>', 'specify the logger verbosity')
  .option('--logdir <path>', 'specify the log directory')
  .option('--noedit', 'do not open generated config in editor')
  .option('-o, --outfile <writepath>', 'write config to path')
  .parse(process.argv);

let exampleConfigPath = path.join(__dirname, '../example/farmer.config.json');
let exampleConfigString = fs.readFileSync(exampleConfigPath).toString();

function getDefaultConfigValue(prop) {
  return {
    value: blindfold(defaultConfig, prop),
    type: typeof blindfold(defaultConfig, prop)
  };
}

function replaceDefaultConfigValue(prop, value) {
  let defaultValue = getDefaultConfigValue(prop);

  function toStringReplace(prop, value, type) {
    switch (type) {
      case 'string':
        value = value.split('\\').join('\\\\'); // NB: Hack windows paths
        return`"${prop}": "${value}"`;
      case 'boolean':
      case 'number':
        return `"${prop}": ${value}`;
      default:
        return '';
    }
  }

  let validVerbosities = new RegExp(/^[0-4]$/);
  if (genaroshare_create.verbosity &&
    !validVerbosities.test(genaroshare_create.verbosity)) {
    console.error('\n  * Invalid verbosity.\n  * Accepted values: 4 - DEBUG | \
  3 - INFO | 2 - WARN | 1 - ERROR | 0 - SILENT\n  * Default value of %s \
  will be used.', getDefaultConfigValue('loggerVerbosity').value);
    genaroshare_create.verbosity = null;
  }

  prop = prop.split('.').pop();
  exampleConfigString = exampleConfigString.replace(
    toStringReplace(prop, defaultValue.value, defaultValue.type),
    toStringReplace(prop, value, defaultValue.type)
  );
}


var FILE;

if(process.argv.length <=2){
  console.error("\n please read --help for start genaroshare-create");
  process.exit(1);
}else{
  if(process.argv[2]!="--name"){
    console.error("\n the --name option should be the first input");
    process.exit(1);
  }
}

if(!genaroshare_create.name){
  console.error("\n the name should be point out ");
  process.exit(1);
}else{

  var count = 1;

      for(var key in keys){
        if(key==genaroshare_create.name){
          console.error("\n your name is duplicated, please change new one.");
          process.exit(1);
        }
    
        if(count==Object.keys(keys).length){
            console.log('\n your account name is unique: ',genaroshare_create.name );
        }
        count +=1;
    }
}


prompt.start();
var Password, Seed;
var schema ={
  properties:{
    seed: {
      description: 'Enter your mnemonic (If you already had a wallet and want to import it.Only support BIP39 specification)'
    },
    password:{
      description: 'Enter your password',
      hidden:true,
      replace: '*', 
      required: true
    }
  }
};

prompt.get(schema, function (err, result) {
   Password = result.password;
   Seed = result.seed;

   if(!keystore.isSeedValid(Seed)) {
    console.error('\nYour mnemonic is invalid.');
    process.exit(1);
   }

new Promise((resolve,reject)=>{
    createKeystore(Password, Seed)
    .then(function(ks) {
      paymentAddress = ks.address;
      return saveProfile(genaroshare_create.name, ks.keystore, ks.address); })    
    .then(()=>{

      if(!genaroshare_create.name){
        console.error('\n you need to give this account a name');
        process.exit(1);
      }
      
      // if(!genaroshare_create.password){
      //   console.error('\n you need to give this account a password');
      //   process.exit(1);
      // }
      
      
      if (!genaroshare_create.key) {
        genaroshare_create.key = storj.KeyPair().getPrivateKey();
      }
      
      if (!genaroshare_create.storage) {
        genaroshare_create.storage = path.join(
          homedir(),
          '.config/genaroshare/shares',
          storj.KeyPair(genaroshare_create.key).getNodeID()
        );
        mkdirp.sync(genaroshare_create.storage);
      }
      
      if (!genaroshare_create.outfile) {
        const configDir = path.join(homedir(), '.config/genaroshare/configs');
        genaroshare_create.outfile = path.join(
          configDir, storj.KeyPair(genaroshare_create.key).getNodeID() + '.json'
        );
        mkdirp.sync(configDir);
        touch.sync(genaroshare_create.outfile);
      }
      
      if (!genaroshare_create.logdir) {
        genaroshare_create.logdir = path.join(
          homedir(),
          '.config/genaroshare/logs'
        );
        mkdirp.sync(genaroshare_create.logdir);
      }
      
      if (genaroshare_create.size &&
          !genaroshare_create.size.match(/[0-9]+(T|M|G|K)?B/g)) {
        console.error('\n Invalid storage size specified: '+
                      genaroshare_create.size);
        process.exit(1);
      }

      replaceDefaultConfigValue('paymentAddress', paymentAddress);
      replaceDefaultConfigValue('networkPrivateKey', genaroshare_create.key);
      replaceDefaultConfigValue('storagePath',
                                path.normalize(genaroshare_create.storage));
      replaceDefaultConfigValue('loggerOutputFile',
                                path.normalize(genaroshare_create.logdir));
      
      const optionalReplacements = [
        { option: genaroshare_create.size, name: 'storageAllocation' },
        { option: genaroshare_create.rpcaddress, name: 'rpcAddress' },
        { option: genaroshare_create.rpcport, name: 'rpcPort' },
        { option: genaroshare_create.maxtunnels, name: 'maxTunnels' },
        { option: genaroshare_create.tunnelportmin, name: 'tunnelGatewayRange.min' },
        { option: genaroshare_create.tunnelportmax, name: 'tunnelGatewayRange.max' },
        { option: genaroshare_create.manualforwarding, name: 'doNotTraverseNat' },
        { option: genaroshare_create.verbosity, name: 'loggerVerbosity' }
      ];
      
      optionalReplacements.forEach((repl) => {
        if (repl.option) {
          replaceDefaultConfigValue(repl.name, repl.option);
        }
      });
      
      let outfile = path.isAbsolute(genaroshare_create.outfile) ?
                      path.normalize(genaroshare_create.outfile) :
                      path.join(process.cwd(), genaroshare_create.outfile);      
      
      FILE = outfile 
      return afs.writeFileAsync(FILE,exampleConfigString);    
    })
    .then(()=>{

      console.log(`\n  * configuration written to ${FILE}`);
      if (!genaroshare_create.noedit) {
        console.log('  * opening in your favorite editor to tweak before running');
        editor(FILE, {
          // NB: Not all distros ship with vim, so let's use GNU Nano
          editor: process.platform === 'win32'
                  ? null
                  : whichEditor()
        }, () => {
          console.log('  ...');
          console.log(`  * use new config: genaroshare start --config ${FILE}`);
        });
      }            
    })
    .catch((err)=>{
          console.log (`\n  failed to write config, reason: ${err.message}`);
          process.exit(1);
    })   
  
})

});
