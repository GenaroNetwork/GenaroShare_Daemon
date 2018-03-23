#!/usr/bin/env node

'use strict';

require('./globalsetting');

const config = require('../lib/config/daemon');
const utils = require('../lib/utils');
const genaroshare_checkreward = require('commander');


genaroshare_checkreward
  .description('check reward')
  .option('-i, --nodeid <nodeid>', 'id of the managed node')
  .option('-r, --remote <hostname:port>',
    'hostname and optional port of the daemon')
  .parse(process.argv);

if (!genaroshare_checkreward.nodeid) {
  console.error('\n  missing node id, try --help');
  process.exit(1);
}

let port = config.daemonRpcPort;
let address = null;
if (genaroshare_checkreward.remote) {
  address = genaroshare_checkreward.remote.split(':')[0];
  if (genaroshare_checkreward.remote.split(':').length > 1) {
    port = parseInt(genaroshare_checkreward.remote.split(':')[1], 10);
  }
}

utils.connectToDaemon(port, function(rpc, sock) {
  rpc.checkReward(genaroshare_checkreward.nodeid, (err, rwd) => {
    if (err) {
      console.error(`\n  error check reward, reason: ${err.message}`);
      return sock.end();
    }
    console.info(`\n  * nodeId: ${rwd.nodeId}`);
    console.info(`\n  * stake wallet: ${rwd.wallet}`);
    console.info(`\n  * earned GNX: ${rwd.earnedGnx}`);
    sock.end();
  });
}, address);
