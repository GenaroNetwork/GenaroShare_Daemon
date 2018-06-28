#!/usr/bin/env node

'use strict';

require('./globalsetting');
const { homedir } = require('os');
const fs = require('fs');
const path = require('path');
const walletManager = require("jswallet-manager");
const config = require('../lib/config/daemon');
const utils = require('../lib/utils');
const genaroshare_createWallet = require('commander');
const bip39 = require('bip39');

const walletsPath = path.join(homedir(), '.sharertest');
if (!fs.existsSync(walletsPath)) {
    fs.mkdirSync(walletsPath);
}

var wm = walletManager.newWalletManager(walletsPath);

genaroshare_createWallet
    .description('create a new wallet')
    .option('-n, --name <name>', 'wallet name')
    .option('-r, --remote <hostname:port>',
        'hostname and optional port of the daemon')
    .parse(process.argv);

let port = config.daemonRpcPort;
let address = null;
if (genaroshare_createWallet.remote) {
    address = genaroshare_createWallet.remote.split(':')[0];
    if (genaroshare_createWallet.remote.split(':').length > 1) {
        port = parseInt(genaroshare_createWallet.remote.split(':')[1], 10);
    }
}

var prompt = require('prompt');
prompt.start();
var Password, Mnemonic;
var schema = {
    properties: {
        mnemonic: {
            description: 'Enter your mnemonic (If you already had a wallet and want to import it.Only support BIP39 specification)'
        },
        password: {
            description: 'Enter your password',
            hidden: true,
            replace: '*',
            required: true
        }
    }
};

prompt.get(schema, function (err, result) {
    Password = result.password;
    Mnemonic = result.mnemonic;

    if (!Mnemonic) {
        Mnemonic = bip39.generateMnemonic();
    }

    if (!bip39.validateMnemonic(Mnemonic)) {
        console.error('\nYour mnemonic is invalid.');
        process.exit(1);
    }

    var v3json, pk;
    try {
        v3json = wm.importFromMnemonic(Mnemonic, Password, genaroshare_createWallet.name);
        pk = wm.exportPrivateKey(v3json.address, Password);
    }
    catch(e) {
        console.log('\n error:' + e);
        process.exit(1);
    }

    console.log('\n You have successfully created a new wallet.');
    console.log('THIS IS YOUR WALLET ADDR, PRIVATE KEY AND MNEMONIC, PLEASE WRITE DOWN. THIS WILL ONLY SHOW ONCE:\n');
    console.log('wallet address: ' + v3json.address);
    console.log('private key: 0x' + pk);
    console.log('mnemonic:' + Mnemonic);
    console.log('\nYou can import this key into other wallet software')
});
