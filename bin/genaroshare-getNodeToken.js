#!/usr/bin/env node

'use strict';

require('./globalsetting');

const config = require('../lib/config/daemon');
const utils = require('../lib/utils');
const genaroshare_getNodeToken = require('commander');

genaroshare_getNodeToken
    .description('starts stake to share the storage')
    .option('-a, --address <address>', 'wallet address(required)')
    .option('-c, --config <path>', 'specify the configuration path(required)')
    .option('-r, --remote <hostname:port>',
        'hostname and optional port of the daemon')
    .parse(process.argv);

if (!genaroshare_getNodeToken.address) {
    console.error('\n  missing address, try --help');
    process.exit(1);
}

if (!genaroshare_getNodeToken.config) {
    console.error('\n  no config file was given, try --help');
    process.exit(1);
}

let port = config.daemonRpcPort;
let address = null;
if (genaroshare_getNodeToken.remote) {
    address = genaroshare_getNodeToken.remote.split(':')[0];
    if (genaroshare_getNodeToken.remote.split(':').length > 1) {
        port = parseInt(genaroshare_getNodeToken.remote.split(':')[1], 10);
    }
}

utils.connectToDaemon(port, function (rpc, sock) {
    rpc.getNodeToken(genaroshare_getNodeToken.config, genaroshare_getNodeToken.address, (err, token) => {
        if (err) {
            console.error(`\n  get token error, reason: ${err.message}`);
            return sock.end();
        }
        console.info(`\n  * token: ${token}`);
        return sock.end();
    });
}, address);