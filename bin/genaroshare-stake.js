#!/usr/bin/env node

'use strict';

require('./globalsetting');

const config = require('../lib/config/daemon');
const utils = require('../lib/utils');
const genaroshare_stake = require('commander');

const DEFAULT_GASPRICE = 10;
const DEFAULT_GASLIMIT = 210000;

genaroshare_stake
    .description('starts stake to share the storage')
    .option('-a, --address <address>', 'wallet address(required)')
    .option('-q, --quantity <quantity>', 'set the quantity for stake(required)')
    .option('--gasPrice <gasPrice>', 'set the gasPrice for stake(Gwei), default: ' + DEFAULT_GASPRICE)
    .option('--gasLimit <gasLimit>', 'set the gasLimit for stake, default: ' + DEFAULT_GASLIMIT)
    .option('-r, --remote <hostname:port>',
        'hostname and optional port of the daemon')
    .parse(process.argv);

if (!genaroshare_stake.address) {
    console.error('\n  missing address, try --help');
    process.exit(1);
}

if (!genaroshare_stake.quantity) {
    console.error('\n  missing quantity, try --help');
    process.exit(1);
}

if (!genaroshare_stake.gasPrice) {
    genaroshare_stake.gasPrice = DEFAULT_GASPRICE;
}
genaroshare_stake.gasPrice *= 10 ** 9;

if (!genaroshare_stake.gasLimit) {
    genaroshare_stake.gasLimit = DEFAULT_GASLIMIT;
}

let port = config.daemonRpcPort;
let address = null;
if (genaroshare_stake.remote) {
    address = genaroshare_stake.remote.split(':')[0];
    if (genaroshare_stake.remote.split(':').length > 1) {
        port = parseInt(genaroshare_stake.remote.split(':')[1], 10);
    }
}

var prompt = require('prompt');
prompt.start();
var Password;
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

prompt.get(schema, function (err, result) {
    Password = result.password;

    utils.connectToDaemon(port, function (rpc, sock) {
        rpc.stake(genaroshare_stake.address, Password, genaroshare_stake.quantity, genaroshare_stake.gasPrice, genaroshare_stake.gasLimit, (err, data) => {
            if (err) {
                console.error(`\n  stake error, reason: ${err.message}`);
                return sock.end();
            }
            if (data && data.hash) {
                console.info(`\n  hash: ${data.hash}`);
            }
            if (data && data.receipt) {
                console.info(`\n  * stake successfully`);
                return sock.end();
            }
        });
    }, address);
});