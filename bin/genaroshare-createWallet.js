#!/usr/bin/env node

'use strict';

require('./globalsetting');
const config = require('../lib/config/daemon');
const utils = require('../lib/utils');
const genaroshare_createWallet = require('commander');

genaroshare_createWallet
    .description('create a new wallet')
    .option('-n, --account <account>', 'wallet name')
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

    utils.connectToDaemon(port, function (rpc, sock) {
        rpc.createWallet(Mnemonic, Password, genaroshare_createWallet.account, (err, result) => {
            if (err) {
                console.error(`\n  cannot create wallet, reason: ${err.message}`);
                return sock.end();
            }
            console.log('\n You have successfully created a new wallet.');
            console.log('THIS IS YOUR WALLET ADDR, PRIVATE KEY AND MNEMONIC, PLEASE WRITE DOWN. THIS WILL ONLY SHOW ONCE:\n');
            console.log('wallet address: ' + result.address);
            console.log('private key: 0x' + result.pk);
            console.log('mnemonic:' + result.mnemonic);
            console.log('\nYou can import this key into other wallet software')
            sock.end();
        });
    }, address);
});
