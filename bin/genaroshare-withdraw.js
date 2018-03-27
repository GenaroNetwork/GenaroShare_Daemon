#!/usr/bin/env node

'use strict';

require('./globalsetting');

const {spawn} = require('child_process');
const utils = require('../lib/utils');
const path = require('path');
const genaroshare_withdraw = require('commander');
const stripJsonComments = require('strip-json-comments');
const fs = require('fs');

const Promise = require("bluebird");
const afs = Promise.promisifyAll(require("fs")); 

const isNumber = require('is-number');

const Tx = require('ethereumjs-tx');
const blindfold = require('blindfold');
const Web3 = require("web3");
const {homedir} = require('os');

const KEYSTORE_DIRECTORY = path.resolve(__dirname, '../keystore');
const CONTRACT_DIRECTORY = path.resolve(__dirname, '../contract');

var prompt = require('prompt');
var keystore = require('eth-lightwallet').keystore;
var txutils = require('eth-lightwallet').txutils;
var signing = require('eth-lightwallet').signing;

let chain, GNXAddr, web3Provider
if(process.env.STORJ_NETWORK === "gtest"){
    chain = 3;
    GNXAddr = "0x1F84118c3B0f3f97c63B8e125456d76C78baBed5"
    web3Provider = 'https://ropsten.infura.io/CPKlwMsRTFVy6idI23Yb'
} else {
    chain = 0;
    GNXAddr = "0x6ec8a24cabdc339a06a172f8223ea557055adaa5"
    web3Provider = 'https://mainnet.infura.io/CPKlwMsRTFVy6idI23Yb';
}


genaroshare_withdraw
  .description('withdraw GNX or ETH from the pre-set wallet')
  .option('--name <name>', 'choose the account name(required)' )
  .option('--type <type>', 'set the type of the transferring')
  .option('--quantity <amount>', 'set the quantity of the transferred token')
  .option('--recipient <address>', 'set the recipient of the transaction in address')
  .parse(process.argv);


var KeyPath = path.join(homedir(),'.config/genaroshare/keystore/keys.json');

if(!fs.existsSync(KeyPath)){
    console.error('\n .Json is not found, you need to do genaroshare-create first, try --help');
    process.exit(1);
  }else{
    var keys = JSON.parse(fs.readFileSync(path.join(homedir(),'.config/genaroshare/keystore/keys.json')));
  }


if(process.argv.length <=2){
    console.error("\n please read --help for start genaroshare-withdraw");
    process.exit(1);
}
if(!genaroshare_withdraw.type){
    console.error("\n the type need to be noted as GNX or ETH");
    process.exit(1);
}else{
    var type = genaroshare_withdraw.type.toLowerCase();
    if(type!="gnx" && type !="eth")
    {
        console.error('\n the type could only be GNX or ETH, try --help');
        process.exit(1);
    }
}


if(!genaroshare_withdraw.quantity){
    console.error("\n the quantity should be set");
    process.exit(1);
}else{
    if(!isNumber(genaroshare_withdraw.quantity)){
        console.error('\n the quantity should be number');
        process.exit(1);
    }        
}

if(!genaroshare_withdraw.recipient){
    console.error("\n the recipient needs to be defined");
    process.exit(1);
}else{
    if(!Web3.utils.isAddress(genaroshare_withdraw.recipient)){
        console.error('\n the recipient needs to be defined, try --help');
        process.exit(1);
    }
}



if(!genaroshare_withdraw.name){
    console.error("\n the name should be point out ");
    process.exit(1);
}else{

    var count = 1;
    var account;
    for(var key in keys){
        if(key==genaroshare_withdraw.name){
            account=key;
        }
    
        if(count==Object.keys(keys).length && !account){
            console.error('\n the account is not found in client, try --help');
            process.exit(1);
        }
        count +=1;
    }
}

var decimal;

var recipient = genaroshare_withdraw.recipient;
var schema ={
    properties:{
      password:{
        description: 'Enter your password',
        hidden:true,
        replace: '*', 
        required: true
      }
    }
  };

prompt.start();
prompt.get(schema, function (err, result) {
    var kis = keys[account].keystore;
    // var KS = keystore.deserialize(ks);
    var KS= JSON.stringify( kis );
    var ks = keystore.deserialize(KS);
    var _password = Buffer(result.password).toString('hex');
    ks.keyFromPassword(_password,function(err,pwDerivedKey){
        if(!ks.isDerivedKeyCorrect(pwDerivedKey)){
            console.log("\n password is not correct")
            process.exit(1);
        }
        if(type == "gnx"){
            decimal = 9;
            sendGNX(ks,pwDerivedKey);
        }
        else if(type == "eth"){
            decimal = 18;
            sendETH(ks,pwDerivedKey);
        }
    })
})

var gasPrice;
var Contract;
var abi;
function sendGNX(keystore,pwDerivedKey){
    if (typeof web3 !== 'undefined') {
        var web3 = new Web3(web3.currentProvider);
      } else {
        // set the provider you want from Web3.providers
        var web3 = new Web3(new Web3.providers.HttpProvider(web3Provider));
        web3.eth.getGasPrice()
        .then((gp)=>{
            gasPrice = gp
        })
        .then(()=>{
            return afs.readFileAsync(path.join(CONTRACT_DIRECTORY, '/GNX.json' ),'utf8');
        })
        .then((data)=>{
          var obj = JSON.parse(data);
          abi = obj.abi
          Contract = new web3.eth.Contract(abi,GNXAddr);
        })   
        .then(()=>{
          if(web3.currentProvider.connected !== true)
              console.log('not ready')
          else
              console.log('ready')
      
              var nonceval;
              web3.eth.getTransactionCount(keys[account].address)
              .then((nb)=>{nonceval=nb})
              .then(()=>{
              var quantity = genaroshare_withdraw.quantity*(10**decimal);
              var txOptions = {
                       gasPrice:  web3.utils.toHex(parseInt(gasPrice)),
                       gasLimit:  web3.utils.toHex(200000),
                       value:  0,
                       nonce:  web3.utils.toHex(nonceval),
                       from : keys[account].address,
                       to : GNXAddr,
                       data: Contract.methods.transfer(recipient, quantity).encodeABI(),
                       chainId:chain //ropsten
                       // chainId:0 //mainnet
                   }
      
                // var valueTx = txutils.valueTx(txOptions)
                var transferTx = txutils.functionTx(abi, 'transfer', [recipient,quantity], txOptions)
                var signedValueTx = signing.signTx(keystore, pwDerivedKey, transferTx, keys[account].address)

                console.log(signedValueTx);

                web3.eth.sendSignedTransaction('0x' + signedValueTx.toString('hex'), (err, hash) => {
                    if (err) { console.log(err); return; }
        
                    // Log the tx, you can explore status manually with eth.getTransaction()
                    console.log('tx hash: ' + hash);
                });
      
              })
      
        } 
        ) 
      
      }
}

function sendETH(keystore,pwDerivedKey){
    if (typeof web3 !== 'undefined') {
        var web3 = new Web3(web3.currentProvider);
      } else {
        // set the provider you want from Web3.providers
        var web3 = new Web3(new Web3.providers.HttpProvider(web3Provider));
        web3.eth.getGasPrice()
        .then((gp)=>{
         gasPrice = gp
        })   
        .then(()=>{
          if(web3.currentProvider.connected !== true)
              console.log('not ready')
          else
              console.log('ready')
      
              var nonceval;
              web3.eth.getTransactionCount(keys[account].address)
              .then((nb)=>{nonceval=nb})
              .then(()=>{
      
              var txOptions = {
                       gasPrice:  web3.utils.toHex(parseInt(gasPrice)),
                       gasLimit:  web3.utils.toHex(47000),
                       value:  web3.utils.toHex(genaroshare_withdraw.quantity*(10**decimal)),
                       nonce:  web3.utils.toHex(nonceval),
                       from : keys[account].address,
                       to : recipient,
                       chainId:chain
                   }

                var valueTx = txutils.valueTx(txOptions)
                var signedValueTx = signing.signTx(keystore, pwDerivedKey, valueTx, keys[account].address)

                console.log(signedValueTx);

                web3.eth.sendSignedTransaction('0x' + signedValueTx.toString('hex'), (err, hash) => {
                    if (err) { console.log(err); return; }
      
                    // Log the tx, you can explore status manually with eth.getTransaction()
                    console.log('tx hash: ' + hash);
                });
      
              })
      
        } 
        ) 
      
      }
          
}