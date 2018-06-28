#!/usr/bin/env node

'use strict';

require('./globalsetting');
const config = require('../lib/config/daemon');
const utils = require('../lib/utils');
const genaroshare_listWallets = require('commander');
const Table = require('cli-table');

genaroshare_listWallets
    .description('list wallets')
    .option('-r, --remote <hostname:port>',
        'hostname and optional port of the daemon')
    .parse(process.argv);

let port = config.daemonRpcPort;
let address = null;
if (genaroshare_listWallets.remote) {
    address = genaroshare_listWallets.remote.split(':')[0];
    if (genaroshare_listWallets.remote.split(':').length > 1) {
        port = parseInt(genaroshare_listWallets.remote.split(':')[1], 10);
    }
}

utils.connectToDaemon(port, function (rpc, sock) {
    rpc.listWallets((err, wallets) => {
        if (err) {
            console.error(`\n  cannot list wallets, reason: ${err.message}`);
            return sock.end();
        }
        let table = new Table({
            head: ['Name', 'Address'],
            style: {
                head: ['cyan', 'bold'],
                border: []
            },
            colWidths: [50, 50]
        });

        wallets.forEach(w => {
            table.push([w.name || '', w.address || '']);
        });

        console.log('\n' + table.toString());
        sock.end();
    });
}, address);





