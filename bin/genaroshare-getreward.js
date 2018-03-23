#!/usr/bin/env node

'use strict';

require('./globalsetting');

const config = require('../lib/config/daemon');
const utils = require('../lib/utils');
const genaroshare_getreward = require('commander');
const prompt = require('prompt');


genaroshare_getreward
  .description('check reward')
  .option('-i, --nodeid <nodeid>', 'id of the managed node')
  .option('-r, --remote <hostname:port>',
    'hostname and optional port of the daemon')
  .parse(process.argv);

if (!genaroshare_getreward.nodeid) {
  console.error('\n  missing node id, try --help');
  process.exit(1);
}

let port = config.daemonRpcPort;
let address = null;
if (genaroshare_getreward.remote) {
  address = genaroshare_getreward.remote.split(':')[0];
  if (genaroshare_getreward.remote.split(':').length > 1) {
    port = parseInt(genaroshare_getreward.remote.split(':')[1], 10);
  }
}

utils.connectToDaemon(port, function(rpc, sock) {
  rpc.checkReward(genaroshare_getreward.nodeid, (err, rwd) => {
    if (err) {
      console.error(`\n  error checking reward, reason: ${err.message}`);
      return sock.end();
    }
    prompt.start();
    prompt.get([{
      name: 'yesOrNo',
      description: `you earned ${rwd.earnedGnx} GNX from node ${rwd.nodeId}, the Gas fee to transfer is ${rwd.gasGnx} GNX. \n 
      Your wallet ${rwd.wallet} will get ${rwd.earnedGnx - rwd.gasGnx} GNX. \n
      is it ok (Y/N)`,
      required: true
    }], function (err, presult) {
      if(presult.yesOrNo !== 'Y') {
        console.info('transfer cancelled')
        return sock.end();
      }
      rpc.getReward(genaroshare_getreward.nodeid, (err, result) => {
        if (err) {
          console.error(`\n  error checking reward, reason: ${err.message}`);
          return sock.end();
        }
        if(result.error && result.error !== null) {
          console.error(`\n  error checking reward, reason: ${result.error}`);
          return sock.end()
        }
        console.info(`\n  * transfer on processing, transaction hash is: ${result.txHash}. Please check this on https://etherscan.io`);
        return sock.end();
      })
    });
  });
}, address);
