#!/usr/bin/env node

'use strict';

require('./globalsetting');

const config = require('../lib/config/daemon');
const utils = require('../lib/utils');
const genaroshare_addNodes = require('commander');

const DEFAULT_GASPRICE = 10;
const DEFAULT_GASLIMIT = 210000;

genaroshare_addNodes
    .description('add storage nodes')
    .option('-a, --address <address>', 'wallet address(required)')
    .option('-n, --nodes <nodes>', 'set nodes for add(required)')
    .option('--gasPrice <gasPrice>', 'set the gasPrice(Gwei), default: ' + DEFAULT_GASPRICE)
    .option('--gasLimit <gasLimit>', 'set the gasLimit, default: ' + DEFAULT_GASLIMIT)
    .option('-r, --remote <hostname:port>',
        'hostname and optional port of the daemon')
    .parse(process.argv);

if (!genaroshare_addNodes.address) {
    console.error('\n  missing address, try --help');
    process.exit(1);
}

var nodes = [];
if (!genaroshare_addNodes.nodes) {
    console.error('\n  missing nodes, try --help');
    process.exit(1);
}
else {
    nodes = genaroshare_addNodes.nodes.split(',');
}

if (!genaroshare_addNodes.gasPrice) {
    genaroshare_addNodes.gasPrice = DEFAULT_GASPRICE;
}
genaroshare_addNodes.gasPrice *= 10 ** 9;

if (!genaroshare_addNodes.gasLimit) {
    genaroshare_addNodes.gasLimit = DEFAULT_GASLIMIT;
}

let port = config.daemonRpcPort;
let address = null;
if (genaroshare_addNodes.remote) {
    address = genaroshare_addNodes.remote.split(':')[0];
    if (genaroshare_addNodes.remote.split(':').length > 1) {
        port = parseInt(genaroshare_addNodes.remote.split(':')[1], 10);
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
        rpc.addNodes(genaroshare_addNodes.address, Password, nodes, genaroshare_addNodes.gasPrice, genaroshare_addNodes.gasLimit, (err, data) => {
            if (err) {
                console.error(`\n  addNodes error, reason: ${err.message}`);
                return sock.end();
            }
            if (data && data.hash) {
                console.info(`\n  hash: ${data.hash}`);
            }
            if (data && data.receipt) {
                console.info(`\n  * addNodes successfully`);
                return sock.end();
            }
        });
    }, address);
});