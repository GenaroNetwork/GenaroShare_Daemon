#!/usr/bin/env node

'use strict';

process.env.STORJ_NETWORK = 'gtest';

const config = require('../lib/config/daemon');
const utils = require('../lib/utils');
const genaroshare_destroy = require('commander');


genaroshare_destroy
  .description('stops a running node and removes it from status')
  .option('-i, --nodeid <nodeid>', 'id of the managed node')
  .option('-r, --remote <hostname:port>',
    'hostname and optional port of the daemon')
  .parse(process.argv);

if (!genaroshare_destroy.nodeid) {
  console.error('\n  missing node id, try --help');
  process.exit(1);
}

let port = config.daemonRpcPort;
let address = null;
if (genaroshare_destroy.remote) {
  address = genaroshare_destroy.remote.split(':')[0];
  if (genaroshare_destroy.remote.split(':').length > 1) {
    port = parseInt(genaroshare_destroy.remote.split(':')[1], 10);
  }
}

utils.connectToDaemon(port, function(rpc, sock) {
  rpc.destroy(genaroshare_destroy.nodeid, (err) => {
    if (err) {
      console.error(`\n  cannot destroy node, reason: ${err.message}`);
      return sock.end();
    }
    console.info(`\n  * share ${genaroshare_destroy.nodeid} destroyed`);
    sock.end();
  });
}, address);
