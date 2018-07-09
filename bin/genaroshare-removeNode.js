#!/usr/bin/env node

'use strict';

require('./globalsetting');

const config = require('../lib/config/daemon');
const utils = require('../lib/utils');
const genaroshare_removeNode = require('commander');

const DEFAULT_GASPRICE = 10;
const DEFAULT_GASLIMIT = 210000;

genaroshare_removeNode
    .description('remove storage node')
    .option('-a, --address <address>', 'wallet address(required)')
    .option('-n, --node <node>', 'set node for add(required)')
    .option('--gasPrice <gasPrice>', 'set the gasPrice(Gwei), default: ' + DEFAULT_GASPRICE)
    .option('--gasLimit <gasLimit>', 'set the gasLimit, default: ' + DEFAULT_GASLIMIT)
    .option('-r, --remote <hostname:port>',
        'hostname and optional port of the daemon')
    .parse(process.argv);

if (!genaroshare_removeNode.address) {
    console.error('\n  missing address, try --help');
    process.exit(1);
}

if (!genaroshare_removeNode.node) {
    console.error('\n  missing node, try --help');
    process.exit(1);
}

if (!genaroshare_removeNode.gasPrice) {
    genaroshare_removeNode.gasPrice = DEFAULT_GASPRICE;
}
genaroshare_removeNode.gasPrice *= 10 ** 9;

if (!genaroshare_removeNode.gasLimit) {
    genaroshare_removeNode.gasLimit = DEFAULT_GASLIMIT;
}

let port = config.daemonRpcPort;
let address = null;
if (genaroshare_removeNode.remote) {
    address = genaroshare_removeNode.remote.split(':')[0];
    if (genaroshare_removeNode.remote.split(':').length > 1) {
        port = parseInt(genaroshare_removeNode.remote.split(':')[1], 10);
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
        rpc.removeNode(genaroshare_removeNode.address, Password, genaroshare_removeNode.node, genaroshare_removeNode.gasPrice, genaroshare_removeNode.gasLimit, (err, data) => {
            if (err) {
                console.error(`\n  removeNode error, reason: ${err.message}`);
                return sock.end();
            }
            if (data && data.hash) {
                console.info(`\n  hash: ${data.hash}`);
            }
            if (data && data.receipt) {
                console.info(`\n  * removeNode successfully`);
                return sock.end();
            }
        });
    }, address);
});