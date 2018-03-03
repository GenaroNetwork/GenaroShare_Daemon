#!/usr/bin/env node

'use strict';

const os = require('os');
const path = require('path');
const config = require('../lib/config/daemon');
const utils = require('../lib/utils');
const genaroshare_load = require('commander');

genaroshare_load
  .description('loads a snapshot of nodes and starts all of them')
  .option('-s, --snapshot <path>', 'path to load the snapshot file')
  .option('-r, --remote <hostname:port>',
    'hostname and optional port of the daemon')
  .parse(process.argv);

if (!genaroshare_load.snapshot) {
  genaroshare_load.snapshot = path.join(
    os.homedir(),
    '.config/genaroshare/snapshot'
  );
}

if (!path.isAbsolute(genaroshare_load.snapshot)) {
  genaroshare_load.snapshot = path.join(process.cwd(),
                                       genaroshare_load.snapshot);
}

let port = config.daemonRpcPort;
let address = null;
if (genaroshare_load.remote) {
  address = genaroshare_load.remote.split(':')[0];
  if (genaroshare_load.remote.split(':').length > 1) {
    port = parseInt(genaroshare_load.remote.split(':')[1], 10);
  }
}

utils.connectToDaemon(port, function(rpc, sock) {
  rpc.load(genaroshare_load.snapshot, (err) => {
    if (err) {
      console.error(`\n  cannot load snapshot, reason: ${err.message}`);
      return sock.end();
    }
    console.info(`\n  * snapshot ${genaroshare_load.snapshot} loaded`);
    sock.end();
  });
}, address);
