#!/usr/bin/env node

'use strict';

process.env.STORJ_NETWORK = 'gtest';

const config = require('../lib/config/daemon');
const utils = require('../lib/utils');
const genaroshare_restart = require('commander');

genaroshare_restart
  .description('restarts the running node specified')
  .option('-i, --nodeid <nodeid>', 'id of the running node')
  .option('-a, --all', 'restart all running nodes')
  .option('-r, --remote <hostname:port>',
    'hostname and optional port of the daemon')
  .parse(process.argv);

if (!genaroshare_restart.nodeid && !genaroshare_restart.all) {
  console.error('\n  missing node id, try --help');
  process.exit(1);
}

let port = config.daemonRpcPort;
let address = null;
if (genaroshare_restart.remote) {
  address = genaroshare_restart.remote.split(':')[0];
  if (genaroshare_restart.remote.split(':').length > 1) {
    port = parseInt(genaroshare_restart.remote.split(':')[1], 10);
  }
}

utils.connectToDaemon(port, function(rpc, sock) {
  if (genaroshare_restart.all) {
    console.info('\n  * restarting all managed nodes');
  }

  rpc.restart(genaroshare_restart.nodeid || '*', (err) => {
    if (err) {
      console.error(`\n  cannot restart node, reason: ${err.message}`);
      return sock.end();
    }

    if (genaroshare_restart.nodeid) {
      console.info(`\n  * share ${genaroshare_restart.nodeid} restarted`);
    } else {
      console.info('\n  * all nodes restarted successfully');
    }

    sock.end();
  });
}, address);
