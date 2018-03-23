/**
 * @module config
 */

'use strict';

const mkdirp = require('mkdirp');
const path = require('path');
const {homedir} = require('os');
const datadir = path.join(homedir(), '.config', 'genaroshare');

mkdirp.sync(datadir);
mkdirp.sync(path.join(datadir, 'logs'));
mkdirp.sync(path.join(datadir, 'shares'));
mkdirp.sync(path.join(datadir, 'configs'));
mkdirp.sync(path.join(datadir, 'keystore'));

module.exports = require('rc')('genaroshare', {
  daemonRpcPort: 45015,
  daemonRpcAddress: '127.0.0.1',
  daemonLogFilePath: path.join(datadir, 'logs', 'daemon.log'),
  daemonLogVerbosity: 3
});
