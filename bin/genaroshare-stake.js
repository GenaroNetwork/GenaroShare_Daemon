#!/usr/bin/env node

'use strict';

require('./globalsetting');

const {spawn} = require('child_process');
const utils = require('../lib/utils');
const path = require('path');
const genaroshare_stake = require('commander');
const stripJsonComments = require('strip-json-comments');
const fs = require('fs');

const Promise = require("bluebird");
const afs = Promise.promisifyAll(require("fs")); 

const Tx = require('ethereumjs-tx');
const blindfold = require('blindfold');
const Web3 = require("web3");
const {homedir} = require('os');

const KEYSTORE_DIRECTORY = path.resolve(__dirname, '../keystore');
const CONTRACT_DIRECTORY = path.resolve(__dirname, '../contract');

var GNXAddr = "0x1F84118c3B0f3f97c63B8e125456d76C78baBed5"
var EmuAddr = "0xd0c419feC9541d23176A48648d3473d7E5185f70"

genaroshare_stake
  .description('starts stake to share the storage')
  .option('--nodeID <nodeid>', 'set the stake to certain nodeID (required)' )
  .option('--quantity <amount>', 'set the quantity for stake, and will get a respond of size of sharing')
  .option('--option <option>', 'set the option for months to be shared')
  .parse(process.argv);


  // start to do the input check 
var KeyPath = path.join(homedir(),'.config/genaroshare/keystore/keys.json');

if(!fs.existsSync(KeyPath)){
    console.error('\n .Json is not found, you need to do genaroshare-create first, try --help');
    process.exit(1);
  }else{
    var keys = JSON.parse(fs.readFileSync(path.join(homedir(),'.config/genaroshare/keystore/keys.json')));
  }
  
if(!genaroshare_stake.nodeID){
  console.error('\n need to input your nodeid to continue, try -- help');
  process.exit(1);
}

if(!genaroshare_stake.quantity){
  console.error('\n  no quantity was set, try --help');
  process.exit(1);
}
else if(genaroshare_stake.quantity < minValue){
  console.error('\n  not reach the limit of stake, should stake at least 5000GNX');
  process.exit(1);
}

if(!genaroshare_stake.option){
  console.error('\n  no option was set, try --help');
  process.exit(1);
}
else{
  if(!checkRate(genaroshare_stake.option)){
    console.error('\n please input integers as option');
    process.exit(1);
  }
}

for(var key in keys){
  if(keys[key].address == getConfigValue('paymentAddress').value){
     console.log(key);
    
     //start the staking 
     
     getAddressStaked(keys[key]);
  }
}


// first load the striped JSON and the full JSON file
const config = JSON.parse(stripJsonComments(fs.readFileSync(
  path.join(homedir(), '.config/genaroshare/configs/'+genaroshare_stake.nodeID+'.json')
).toString()));


var minValue = 5000;

// utility functions
function getConfigValue(prop) {
  return {
    value: blindfold(config, prop),
    type: typeof blindfold(config, prop)
  };
}

function checkRate(input)
{
     var re = /^[0-9]+[0-9]*]*$/;

     if (!re.test(input))
    {
        return false;
     }
     return true;
}

function hex8(val) {
  val &= 0xFF;
  var hex = val.toString(16).toUpperCase();
  return ("00" + hex).slice(-1);
}

function toUTF8Array(str) {
  var utf8 = [];
  for (var i=0; i < str.length; i++) {
      var charcode = str.charCodeAt(i);
      if (charcode < 0x80) utf8.push(charcode);
      else if (charcode < 0x800) {
          utf8.push(0xc0 | (charcode >> 6), 
                    0x80 | (charcode & 0x3f));
      }
      else if (charcode < 0xd800 || charcode >= 0xe000) {
          utf8.push(0xe0 | (charcode >> 12), 
                    0x80 | ((charcode>>6) & 0x3f), 
                    0x80 | (charcode & 0x3f));
      }
      // surrogate pair
      else {
          i++;
          // UTF-16 encodes 0x10000-0x10FFFF by
          // subtracting 0x10000 and splitting the
          // 20 bits of 0x0-0xFFFFF into two halves
          charcode = 0x10000 + (((charcode & 0x3ff)<<10)
                    | (str.charCodeAt(i) & 0x3ff));
          utf8.push(0xf0 | (charcode >>18), 
                    0x80 | ((charcode>>12) & 0x3f), 
                    0x80 | ((charcode>>6) & 0x3f), 
                    0x80 | (charcode & 0x3f));
      }
  }
  return utf8;
}

function getAddressStaked(key){
  var gasPrice, Contract;  
  if (typeof web3 !== 'undefined') {
    var web3 = new Web3(web3.currentProvider);
  } else {
    // set the provider you want from Web3.providers
    var web3 = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io/wYBhtj2SSUB7qlztqEjx"));
    web3.eth.getGasPrice()
    .then((gp)=>{
      gasPrice = gp
    })
    .then(()=>{
      return afs.readFileAsync(path.join(CONTRACT_DIRECTORY, '/GNX.json' ),'utf8');
    })
    .then((data)=>{
      var obj = JSON.parse(data);
      var abi = obj.abi
      Contract = new web3.eth.Contract(abi,GNXAddr);
    })   
    .then(()=>{
      if(web3.currentProvider.connected !== true)
          console.log('not ready yet, please try again')
      else
          console.log('starting in seconds...')
  
          var nonceval;
          // var _str = '0x'+hex8(genaroshare_stake.option)+genaroshare_stake.nodeID;
          var _str = hex8(genaroshare_stake.option)+genaroshare_stake.nodeID;          
          var _buffer = toUTF8Array(_str)         
          var _newstr = web3.utils.bytesToHex(_buffer)
          web3.eth.getTransactionCount(key.address)
          .then((nb)=>{nonceval=nb})
          .then(()=>{
  
          var txOptions = {
                   gasPrice:  web3.utils.toHex(parseInt(gasPrice)),
                   gasLimit:  web3.utils.toHex(470000),
                   value:  0,
                   nonce:  web3.utils.toHex(nonceval),
                   from : key.address,
                   to : GNXAddr,
                   data: Contract.methods.approveAndCall(EmuAddr,genaroshare_stake.quantity*10**9,_newstr).encodeABI(),
                   chainId:3 //ropsten
                   // chainId:0 //mainnet
               }
  
            // key should be the one from genaro stake stakebase
            var privateKey = Buffer.from(key.privateKey,'hex')
            var tx = new Tx(txOptions);
            tx.sign(privateKey);
            var serializedTx = tx.serialize();
  
            console.log('');
            console.log(serializedTx.toString('hex'));
  
            web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'), (err, hash) => {
                if (err) { console.log(err); return; }
  
                console.log('stake tx hash: ' + hash);
            });
  
          })
  
        }) 
      }
    }

  




