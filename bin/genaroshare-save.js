#!/usr/bin/env node

'use strict';

const os = require('os');
const path = require('path');
const config = require('../lib/config/daemon');
const utils = require('../lib/utils');
const genaroshare_save = require('commander');

genaroshare_save
  .description('saves a snapshot of nodes')
  .option('-s, --snapshot <path>', 'path to write the snapshot file')
  .option('-r, --remote <hostname:port>',
    'hostname and optional port of the daemon')
  .parse(process.argv);

if (!genaroshare_save.snapshot) {
  genaroshare_save.snapshot = path.join(
    os.homedir(),
    '.config/genaroshare/snapshot'
  );
}

if (!path.isAbsolute(genaroshare_save.snapshot)) {
  genaroshare_save.snapshot = path.join(process.cwd(),
                                       genaroshare_save.snapshot);
}

let port = config.daemonRpcPort;
let address = null;
if (genaroshare_save.remote) {
  address = genaroshare_save.remote.split(':')[0];
  if (genaroshare_save.remote.split(':').length > 1) {
    port = parseInt(genaroshare_save.remote.split(':')[1], 10);
  }
}

utils.connectToDaemon(port, function(rpc, sock) {
  rpc.save(genaroshare_save.snapshot, (err) => {
    if (err) {
      console.error(`\n  cannot save snapshot, reason: ${err.message}`);
      return sock.end();
    }
    console.info(`\n  * snapshot ${genaroshare_save.snapshot} saved`);
    sock.end();
  });
}, address);
