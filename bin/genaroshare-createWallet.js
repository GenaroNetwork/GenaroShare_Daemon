#!/usr/bin/env node

'use strict';

require('./globalsetting');
const config = require('../lib/config/daemon');
const utils = require('../lib/utils');
const genaroshare_createWallet = require('commander');

genaroshare_createWallet
    .description('create a new wallet')
    .option('-n, --account <account>', 'wallet name')
    .option('-t, --type <import wallet type>', 'import wallet type, can be "privateKey" or "mnemonic"')
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
var Password, Mnemonic, PrivateKey;
var schema = {
    properties: {
        password: {
            description: 'Enter your password',
            hidden: true,
            replace: '*',
            required: true
        }
    }
};

if (genaroshare_createWallet.type === 'privateKey') {
    schema.properties.privateKey = {
        description: 'Enter your privateKey'
    };
}
else if (genaroshare_createWallet.type === 'mnemonic') {
    schema.properties.mnemonic = {
        description: 'Enter your mnemonic (If you already had a wallet and want to import it.Only support BIP39 specification)'
    };
}

prompt.get(schema, function (err, result) {
    Password = result.password;
    Mnemonic = result.mnemonic;
    PrivateKey = result.privateKey;

    utils.connectToDaemon(port, function (rpc, sock) {
        if (PrivateKey) {
            rpc.createWalletByPrivateKey(PrivateKey, Password, genaroshare_createWallet.account, (err, result) => {
                if (err) {
                    console.error(`\n  cannot create wallet, reason: ${err.message}`);
                    return sock.end();
                }
                console.log('\n You have successfully imported a wallet.');
                console.log('THIS IS YOUR WALLET ADDR:\n');
                console.log('wallet address: ' + result.address);
                sock.end();
            });
        }
        else {
            rpc.createWallet(Mnemonic, Password, genaroshare_createWallet.account, (err, result) => {
                if (err) {
                    console.error(`\n  cannot create wallet, reason: ${err.message}`);
                    return sock.end();
                }
                console.log('\n You have successfully created a new wallet.');
                console.log('THIS IS YOUR WALLET ADDR, PRIVATE KEY AND MNEMONIC, PLEASE WRITE DOWN. THIS WILL ONLY SHOW ONCE:\n');
                console.log('wallet address: ' + result.address);
                console.log('private key: ' + result.pk);
                console.log('mnemonic:' + result.mnemonic);
                console.log('\nYou can import this key into other wallet software')
                sock.end();
            });
        }
    }, address);
});
