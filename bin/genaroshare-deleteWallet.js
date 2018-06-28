#!/usr/bin/env node

'use strict';

require('./globalsetting');
const config = require('../lib/config/daemon');
const walletManager = require("jswallet-manager");
const utils = require('../lib/utils');
const genaroshare_deleteWallet = require('commander');

genaroshare_deleteWallet
    .description('delete wallet')
    .option('-a, --address <address>', 'wallet address')
    .option('-r, --remote <hostname:port>',
        'hostname and optional port of the daemon')
    .parse(process.argv);

if (!genaroshare_deleteWallet.address) {
    console.error('\n  no address was given, try --help');
    process.exit(1);
}

let port = config.daemonRpcPort;
let address = null;
if (genaroshare_deleteWallet.remote) {
    address = genaroshare_deleteWallet.remote.split(':')[0];
    if (genaroshare_deleteWallet.remote.split(':').length > 1) {
        port = parseInt(genaroshare_deleteWallet.remote.split(':')[1], 10);
    }
}

utils.connectToDaemon(port, function (rpc, sock) {
    rpc.deleteWallet(genaroshare_deleteWallet.address, (err) => {
        if (err) {
            console.error(`\n  cannot delete wallet, reason: ${err.message}`);
            return sock.end();
        }
        console.log('\n Your have deleted the wallet: ' + genaroshare_deleteWallet.address);
        sock.end();
    });
}, address);
