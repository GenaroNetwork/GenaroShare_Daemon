/**
 * @module utils
 */

'use strict';

const dnode = require('dnode');
const net = require('net');
const fs = require('fs');
const { homedir } = require('os');
const path = require('path');
const storj = require('genaro-lib');
const {bitcore} = storj.deps;
const du = require('du');          // Get amount used
const disk = require('diskusage'); // Get amount free
const assert = require('assert');
const bytes = require('bytes');
const web3utils = require('web3-utils');
const walletManager = require("jswallet-manager");
const Web3 = require("genaro-web3");

var STX_ADDR, web3Provider, chainId;
if(process.env.STORJ_NETWORK === "gtest") {
  STX_ADDR = '0x6000000000000000000000000000000000000000';
  web3Provider = 'ws://47.100.34.71:8547';
  chainId = 3;
} else {
  STX_ADDR = '0x6000000000000000000000000000000000000000';
  web3Provider = 'ws://47.100.34.71:8547';
  chainId = 0;
}


/**
 * Validate the given payout address
 * @param {String} address
 */
exports._isValidPayoutAddress = function(address) {
  return bitcore.Address.isValid(address) ||
         bitcore.Address.isValid(address, bitcore.Networks.testnet) ||
         this.isValidEthereumAddress(address);
};

/**
 * Validate the given payout address is an Ethereum address
 * @param {String} address
 */
exports.isValidEthereumAddress = function(address) {
  //Disallow contract and contract owner addresses
  //Stops users from accidentally copying the wrong address
  const disallowAddresses = [
    '0xb64ef51c888972c908cfacf59b47c1afbc0ab8ac',
    '0x00f6bf3c5033e944feddb3dc8ffb4d47af17ef0b'
  ];
  if (typeof address !== 'string') {
    return false;
  } else if (disallowAddresses.indexOf(address.toLowerCase()) >= 0) {
    return false;
  }
  return /^0x/.test(address) && web3utils.isAddress(address);
};

/**
 * Validate the given dataserv directory
 * @param {String} directory
 */
exports._isValidDirectory = function(directory) {
  return this.existsSync(directory);
};

/**
 * Validate the given size
 * @param {String} size
 */
exports._isValidSize = function(size) {
  return typeof size === 'number'
    && size >= 0
    && size <= 8 * Math.pow(2, 40); // 8TiB
};

/**
 * Validates a given tab config
 * @param {Object} config
 */
exports.validate = function(config) {
  assert(this._isValidPayoutAddress(config.paymentAddress),
         'Invalid payout address');
  assert(this._isValidDirectory(config.storagePath), 'Invalid directory');
  assert(this._isValidSize(bytes.parse(config.storageAllocation)),
         'Invalid storage size');
  assert(this._isValidDirectory(config.storagePath),
         'Could not create Shard Directory');
};

/**
 * Attempts to apply common fixes to a config
 * @param {Object} config
 */
exports.repairConfig = function(config) {
  // Check to see if the size is not using a storage unit
  if(!isNaN(parseInt(config.storageAllocation))
    && this._isValidSize(config.storageAllocation)) {
      config.storageAllocation = config.storageAllocation.toString() + 'B';
  }
    return config;
};

/**
 * Validates the space being allocated exists
 * @param {Object} config
 */
exports.validateAllocation = function(conf, callback) {
  const self = this;

  if (!self._isValidStorageAllocationFormat(conf.storageAllocation)) {
    if (isNaN(conf.storageAllocation)) {
      return callback(
        new Error('Invalid storage size specified: '+ conf.storageAllocation)
      );
    }

    conf.storageAllocation = conf.storageAllocation.toString() + 'B';
  }

  callback(null);
};

/**
 * Check if file exists
 * @param {String} file - Path to file
 */
exports.existsSync = function(file) {
  try {
    fs.statSync(file);
  } catch(err) {
    return !(err);
  }

  return true;
};

/**
 * Check if StorageAllocation is formatted properly (Size + Unit)
 * @param {String} storage - storage Allocation from config
 */
exports._isValidStorageAllocationFormat = function(storageAllocation) {
    if (!storageAllocation.toString().match(
          /[0-9]+([Tt]|[Mm]|[Gg]|[Kk])?[Bb]/g)
    ) {
      return false;
    }

    return true;
};

/**
 * Recursively determines the size of a directory
 * @param {String} dir - Directory to traverse
 * @param {Function} callback
 */
exports.getDirectorySize = function(dir, callback) {
  /* istanbul ignore next */
  du(dir, {
    filter: function(f) {
      return f.indexOf('contracts.db') !== -1 ||
             f.indexOf('sharddata.kfs') !== -1;
    }
  }, callback);
};

/**
 * Get free space on disk of path
 * @param {String} path
 */
/* istanbul ignore next */
exports.getFreeSpace = function(path, callback) {
  if (!exports.existsSync(path)) {
    return callback(null, 0);
  }

  disk.check(path, function(err, info) {
    if (err) {
      return callback(err);
    }

    return callback(null, info.available);
  });
};

/**
 * Checks whether a port is currently in use or open
 * Callback is of form (err, result)
 * @param {Number} port
 * @param {Function} callback
 */
exports.portIsAvailable = function(port, callback) {
  if(typeof port !== 'number' || port < 0 || port > 65535) {
    return callback('Invalid port');
  } else if (port <= 1024) {
    return callback(
      'Using a port in the well-known range is strongly discouraged');
  }
  let testServer = net.createServer()
  .once('error', function() {
    testServer.once('close', function() {
      callback(null, false);
    })
    .close();
  })
  .once('listening', function() {
    testServer.once('close', function() {
      callback(null, true);
    })
    .close();
  })
  .listen(port);
};

/**
 * Checks the status of the daemon RPC server
 * @param {Number} port
 * @param {Function} callback
 * @param {String} hostname - optional
 */
exports.checkDaemonRpcStatus = function(port, callback, hostname = null) {
  if (!hostname) {
    hostname = '127.0.0.1';
  }
  const sock = net.connect(port, hostname);

  sock.once('error', function() {
    callback(false);
  });

  sock.once('connect', () => {
    sock.end();
    callback(true);
  });
};

/**
 * Connects to the daemon and callback with rpc
 * @param {Number} port
 * @param {Function} callback
 * @param {String} hostname - optional
 */
exports.connectToDaemon = function(port, callback, hostname = null) {
  if (!hostname) {
    hostname = '127.0.0.1';
  }
  const sock = dnode.connect(hostname, port);

  sock.on('error', function() {
    process.exitCode = 1;
    console.error('\n  daemon is not running, try: genaroshare daemon');
  });

  sock.on('remote', (rpc) => callback(rpc, sock));
};

/**
 * Get node Id by Private Key
 * @param {String} privateKey
 */
 exports.getNodeID = function(privateKey) {
  let nodeId = null;
  try {
    nodeId = storj.KeyPair(privateKey).getNodeID();
  } catch (err) {
    return null;
  }

  return nodeId;
};

/**
 * get wallets folder path
 */
exports.getWalletsFolderPath = function(){
  const walletsDir = path.join(homedir(), '.genaro');
  if (!fs.existsSync(walletsDir)) {
    fs.mkdirSync(walletsDir);
  }
  const walletsPath = path.join(walletsDir, 'wallet');
  if (!fs.existsSync(walletsPath)) {
    fs.mkdirSync(walletsPath);
  }
  return walletsPath;
};

exports.validatePassword = function(address, password) {
  try {
    var wm = walletManager.newWalletManager(this.getWalletsFolderPath());
    return wm.validatePassword(address, password);
  } catch (e) {
    return false;
  }
};

exports.generateSignedSpecialTx = async function (address, password, gas, gasLimit, inputData, callback) {
  const web3 = new Web3(new Web3.providers.WebsocketProvider(web3Provider));
  let nonceval = await web3.eth.getTransactionCount(address);
  web3.currentProvider.connection.close()

  let txOptions = {
    gasPrice: web3utils.toHex(parseInt(gas)),
    gasLimit: web3utils.toHex(gasLimit),
    value: web3utils.toHex(0),
    nonce: web3utils.toHex(nonceval),
    from: address,
    to: STX_ADDR,
    data: JSON.stringify(inputData)
  };
  try {
    var wm = walletManager.newWalletManager(this.getWalletsFolderPath());
    var tx = wm.signTx(address, password, txOptions);
    return callback(null, tx);
  } catch (e) {
    return callback(e);
  }
};

exports.sendTransaction = function (rawTx, callback) {
  const web3 = new Web3(new Web3.providers.WebsocketProvider(web3Provider));
  web3.eth.sendSignedTransaction(rawTx).once('transactionHash', function (hash) {
    callback(null, { hash });
  }).on('error', function (error) {
    callback(error);
    web3.currentProvider.connection.close()
  }).then(function (receipt) {
    callback(null, { receipt });
    web3.currentProvider.connection.close()
  });
};