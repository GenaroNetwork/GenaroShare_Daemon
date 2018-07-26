#!/usr/bin/env node

'use strict';

require('./globalsetting');

const config = require('../lib/config/daemon');
const utils = require('../lib/utils');
const genaroshare_addNode = require('commander');

const DEFAULT_GASPRICE = 10;
const DEFAULT_GASLIMIT = 210000;

genaroshare_addNode
    .description('add storage node')
    .option('-a, --address <address>', 'wallet address(required)')
    .option('-t, --token <token>', 'set node token for add(required)')
    .option('--gasPrice <gasPrice>', 'set the gasPrice(Gan), default: ' + DEFAULT_GASPRICE)
    .option('--gasLimit <gasLimit>', 'set the gasLimit(An), default: ' + DEFAULT_GASLIMIT)
    .option('-r, --remote <hostname:port>',
        'hostname and optional port of the daemon')
    .parse(process.argv);

if (!genaroshare_addNode.address) {
    console.error('\n  missing address, try --help');
    process.exit(1);
}

if (!genaroshare_addNode.token) {
    console.error('\n  missing token, try --help');
    process.exit(1);
}

if (!genaroshare_addNode.gasPrice) {
    genaroshare_addNode.gasPrice = DEFAULT_GASPRICE;
}
genaroshare_addNode.gasPrice *= 10 ** 9;

if (!genaroshare_addNode.gasLimit) {
    genaroshare_addNode.gasLimit = DEFAULT_GASLIMIT;
}

let port = config.daemonRpcPort;
let address = null;
if (genaroshare_addNode.remote) {
    address = genaroshare_addNode.remote.split(':')[0];
    if (genaroshare_addNode.remote.split(':').length > 1) {
        port = parseInt(genaroshare_addNode.remote.split(':')[1], 10);
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
        let token = genaroshare_addNode.token;
        let ts = token.split('--');
        if(ts.length < 2) {
            return console.error(`\n token error`);
        }
        rpc.addNode(genaroshare_addNode.address, Password, ts[1], ts[0], genaroshare_addNode.gasPrice, genaroshare_addNode.gasLimit, (err, data) => {
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