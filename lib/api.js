'use strict';

const async = require('async');
const fs = require('fs');
const {statSync, readFileSync} = require('fs');
const stripJsonComments = require('strip-json-comments');
const FsLogger = require('fslogger');
const JsonLogger = require('kad-logger-json');
const {fork} = require('child_process');
const utils = require('./utils');
const path = require('path');
const { cpus } = require('os');
const {homedir} = require('os');
const walletManager = require("jswallet-manager");
const ethUtil = require("ethereumjs-util");

/** Class representing a local RPC API's handlers */
class RPC {

  /**
   * Creates a environment to manage node processes
   * @param {Object} options
   * @param {Number} options.logVerbosity
   */
  constructor(options={}) {
    this.jsonlogger = new JsonLogger(options.logVerbosity);
    this.shares = new Map();
  }

  /**
   * Logs the message by pushing it out the stream
   * @param {String} message
   * @param {String} level
   */
  _log(msg, level='info') {
    this.jsonlogger[level](msg);
  }

  /**
   * Handles IPC messages from a running node
   * @private
   */
  _processShareIpc(share, msg) {
    // NB: We receive a complete state object from nodes when an event
    // NB: occurs that updates the state object
    share.meta.farmerState = msg;
  }

  /**
   * Reads the config file and returns the parsed version
   * @private
   */
  _readConfig(configPath) {
    let config = null;

    try {
      statSync(configPath);
    } catch (err) {
      throw new Error(`failed to read config at ${configPath}`);
    }

    try {
      config = JSON.parse(stripJsonComments(
        readFileSync(configPath).toString()
      ));
    } catch (err) {
      throw new Error(`failed to parse config at ${configPath}`);
    }

    config = utils.repairConfig(config);

    try {
      utils.validate(config);
    } catch (err) {
      throw new Error(err.message.toLowerCase());
    }

    return config;
  }

  /**
   * Starts a share process with the given configuration
   * @param {String} configPath
   * @param {Boolean} unsafeFlag
   * @param {RPC~startCallback}
   * @see https://storj.github.io/core/FarmerInterface.html
   */
  start(configPath, callback, unsafeFlag=false) {
    /*jshint maxcomplexity:7 */
    let config = null;

    if (this.running >= cpus().length && !unsafeFlag) {
      return callback(new Error('insufficient system resources available'));
    }

    try {
      config = this._readConfig(configPath);
    } catch (err) {
      return callback(err);
    }

    const nodeId = utils.getNodeID(config.networkPrivateKey);
    if (nodeId === null) {
      return callback(new Error('Invalid Private Key'));
    }

    const share = this.shares.get(nodeId) || {
      config: config,
      meta: {
        uptimeMs: 0,
        farmerState: {
          portStatus: {
            listenPort: '...',
            connectionStatus: -1,
            connectionType: ''
          },
          ntpStatus: {
            delta: '...',
            status: -1
          }
        },
        numRestarts: 0
      },
      process: null,
      readyState: 0,
      path: configPath
    };
    let self = this;
    async.waterfall([
      function(next){
        self._log(`attempting to start node with config at path ${configPath}`);
    
        if (self.shares.has(nodeId) && self.shares.get(nodeId).readyState === 1) {
          return next(new Error(`node ${nodeId} is already running`));
        }

        utils.validateAllocation(share.config, next);
      },
      function(next) {
        self.shares.set(nodeId, share);
        share.meta.uptimeMs = 0;
        /* istanbul ignore next */
        let uptimeCounter = setInterval(() => share.meta.uptimeMs += 1000, 1000);
        
        // NB: Fork the actual farmer process, passing it the configuration
        share.process = fork(
          path.join(__dirname, '../script/farmer.js'),
          ['--config', configPath],
          {
            stdio: [0, 'pipe', 'pipe', 'ipc']
          }
        );
        share.readyState = RPC.SHARE_STARTED;
  
        let loggerOutputFile = !share.config.loggerOutputFile
          ? path.join(homedir(), '.config/genaroshare/logs')
          : share.config.loggerOutputFile;
  
        try {
          if (!fs.statSync(loggerOutputFile).isDirectory()) {
            loggerOutputFile = path.dirname(loggerOutputFile);
          }
        } catch (err) {
          loggerOutputFile = path.dirname(loggerOutputFile);
        }
  
        const fslogger = new FsLogger(loggerOutputFile, nodeId);
  
        fslogger.setLogLevel(config.logVerbosity);
  
        share.process.stderr.on('data', function(data) {
          fslogger.write(data);
        });
  
        share.process.stdout.on('data', function(data) {
          fslogger.write(data);
        });
  
        // NB: Listen for state changes to update the node's record
        share.process.on('error', (err) => {
          share.readyState = RPC.SHARE_ERRORED;
          self._log(err.message, 'error');
          clearInterval(uptimeCounter);
        });
  
        // NB: Listen for exits and restart the node if not stopped manually
        share.process.on('exit', (code, signal) => {
          let maxRestartsReached = share.meta.numRestarts >= RPC.MAX_RESTARTS;
          share.readyState = RPC.SHARE_STOPPED;
  
          self._log(`node ${nodeId} exited with code ${code}`);
          clearInterval(uptimeCounter);
  
          if (signal !== 'SIGINT' &&
            !maxRestartsReached &&
            share.meta.uptimeMs >= 5000
          ) {
            share.meta.numRestarts++;
            self.restart(nodeId, () => null);
          }
        });
  
        share.process.on('message', (msg) => self._processShareIpc(share, msg));
        next(null);
      }
    ], callback);
   }
  /**
   * @callback RPC~startCallback
   * @param {Error|null} error
   */

  /**
   * Stops the node process for the given node ID
   * @param {String} nodeId
   * @param {RPC~stopCallback}
   */
  stop(nodeId, callback) {
    this._log(`attempting to stop node with node id ${nodeId}`);

    if (!this.shares.has(nodeId) || !this.shares.get(nodeId).readyState) {
      return callback(new Error(`node ${nodeId} is not running`));
    }

    this.shares.get(nodeId).process.kill('SIGINT');

    //reset share status
    if (this.shares.has(nodeId)
      && 'meta' in this.shares.get(nodeId)) {
      this.shares.get(nodeId).meta.uptimeMs = 0;
      this.shares.get(nodeId).meta.numRestarts = 0;
      this.shares.get(nodeId).meta.peers = 0;
    }
    if (this.shares.has(nodeId)
      && 'meta' in this.shares.get(nodeId)
      && 'farmerState' in this.shares.get(nodeId).meta) {
      this.shares.get(nodeId).meta.farmerState.bridgesConnectionStatus = 0;
      this.shares.get(nodeId).meta.farmerState.totalPeers = 0;
    }
    if (this.shares.has(nodeId)
      && 'meta' in this.shares.get(nodeId)
      && 'farmerState' in this.shares.get(nodeId).meta
      && 'ntpStatus' in this.shares.get(nodeId).meta.farmerState) {
      this.shares.get(nodeId).meta.farmerState.ntpStatus.delta = 0;
    }

    setTimeout(() => callback(null), 1000);
  }
  /**
   * @callback RPC~stopCallback
   * @param {Error|null} error
   */

  /**
   * Restarts the share process for the given node ID
   * @param {String} nodeId
   * @param {RPC~restartCallback}
   */
  restart(nodeId, callback) {
    this._log(`attempting to restart node with node id ${nodeId}`);

    if (nodeId === '*') {
      return async.eachSeries(
        this.shares.keys(),
        (nodeId, next) => this.restart(nodeId, next),
        callback
      );
    }

    this.stop(nodeId, () => {
      this.start(this.shares.get(nodeId).path, callback);
    });
  }
  /**
   * @callback RPC~restartCallback
   * @param {Error|null} error
   */

  /**
   * Returns status information about the running nodes
   * @param {RPC~statusCallback}
   */
  status(callback) {
    const statuses = [];

    this._log(`got status query`);
    this.shares.forEach((share, nodeId) => {
      statuses.push({
        id: nodeId,
        config: share.config,
        state: share.readyState,
        meta: share.meta,
        path: share.path
      });
    });

    callback(null, statuses);
  }
  /**
   * @callback RPC~statusCallback
   * @param {Error|null} error
   * @param {Object} status
   */

  /**
   * Simply kills the daemon and all managed proccesses
   */
  killall(callback) {
    this._log(`received kill signal, destroying running nodes`);

    for (let nodeId of this.shares.keys()) {
      this.destroy(nodeId, () => null);
    }

    callback();
    setTimeout(() => process.exit(0), 1000);
  }

  /**
   * Kills the node with the given node ID
   * @param {String} nodeId
   * @param {RPC~destroyCallback}
   */
  destroy(nodeId, callback) {
    this._log(`received destroy command for ${nodeId}`);

    if (!this.shares.has(nodeId)) {
      return callback(new Error(`node ${nodeId} is not running`));
    }

    let share = this.shares.get(nodeId);
    if(share.process) {
      share.process.kill('SIGINT');
    }
    this.shares.delete(nodeId);
    callback(null);
  }
  /**
   * @callback RPC~destroyCallback
   * @param {Error|null} error
   */

  /**
   * Saves the current nodes configured
   * @param {String} writePath
   * @param {RPC~saveCallback}
   */
  save(writePath, callback) {
    const snapshot = [];

    this.shares.forEach((val, nodeId) => {
      snapshot.push({
        path: val.path,
        id: nodeId
      });
    });

    fs.writeFile(writePath, JSON.stringify(snapshot, null, 2), (err) => {
      if (err) {
        return callback(
          new Error(`failed to write snapshot, reason: ${err.message}`)
        );
      }

      callback(null);
    });
  }
  /**
   * @callback RPC~saveCallback
   * @param {Error|null} error
   */

  /**
   * Loads a state snapshot file
   * @param {String} readPath
   * @param {RPC~loadCallback}
   */
  load(readPath, callback) {
    fs.readFile(readPath, (err, buffer) => {
      if (err) {
        return callback(
          new Error(`failed to read snapshot, reason: ${err.message}`)
        );
      }

      let snapshot = null;

      try {
        snapshot = JSON.parse(buffer.toString());
      } catch (err) {
        return callback(new Error('failed to parse snapshot'));
      }

      async.eachLimit(snapshot, 1, (share, next) => {
        this.start(share.path, (err) => {
          /* istanbul ignore if */
          if (err) {
            this._log(err.message, 'warn');
          }

          next();
        });
      }, callback);
    });
  }

  createWallet(mnemonic, password, name, callback) {
    if (!mnemonic) {
      mnemonic = walletManager.generateMnemonic();
    }

    if (!walletManager.validateMnemonic(mnemonic)) {
      return callback('Your mnemonic is invalid.');
    }

    try {
      var wm = walletManager.newWalletManager(utils.getWalletsFolderPath());
      var v3json = wm.importFromMnemonic(mnemonic, password, name);
      var pk = wm.exportPrivateKey(v3json.address, password);
      return callback(null, {
        mnemonic,
        address: v3json.address,
        pk
      });
    }
    catch (e) {
      return callback(e);
    }
  }

  createWalletByPrivateKey(privateKey, password, name, callback) {
    if (!privateKey) {
      return callback('missing privateKey.');
    }

    if(privateKey.startsWith('0x')) {
      privateKey = privateKey.substr(2);
    }

    try {
      var wm = walletManager.newWalletManager(utils.getWalletsFolderPath());
      var v3json = wm.importFromPrivateKey(privateKey, password, name);
      return callback(null, {
        address: v3json.address
      });
    }
    catch (e) {
      return callback(e);
    }
  }

  listWallets(callback) {
    var wallets = [];
    try {
        var wm = walletManager.newWalletManager(utils.getWalletsFolderPath());
        wallets = wm.listWallet();
    } catch (e) {
        return callback(e);
    }
    return callback(null, wallets);
  }

  deleteWallet(address, callback) {
    try {
      var wm = walletManager.newWalletManager(utils.getWalletsFolderPath());
      wm.deleteWallet(address);
    } catch (e) {
      return callback(e);
    }
    return callback(null);
  }
  
  /**
   * stake
   */
  stake(address, password, amount, gasPrice, gasLimit, callback) {
    if(!address.startsWith('0x')) {
      address = '0x' + address;
    }
    if(!utils.validatePassword(address, password)) {
      return callback({message: 'password error'});
    }
    var inputDate = {
      address: address,
      type: '0x1',
      stake: parseInt(amount)
    };
    utils.generateSignedSpecialTx(address, password, gasPrice, gasLimit, inputDate, function(err, tx) {
      if(err) {
        return callback(err);
      }
      utils.sendTransaction(tx, callback);
    });
  }

  addNode(address, password, nodeId, token, gasPrice, gasLimit, callback){
    if(!address.startsWith('0x')) {
      address = '0x' + address;
    }
    if(!utils.validatePassword(address, password)) {
      return callback({message: 'password error'});
    }
    var inputData = {
      type: "0x8",
      nodeId: nodeId,
      address: address,
      sign: token,
    };
    utils.generateSignedSpecialTx(address, password, gasPrice, gasLimit, inputData, function(err, tx) {
      if(err) {
        return callback(err);
      }
      utils.sendTransaction(tx, callback);
    });
  }

  removeNode(address, password, node, gasPrice, gasLimit, callback){
    if(!address.startsWith('0x')) {
      address = '0x' + address;
    }
    if(!utils.validatePassword(address, password)) {
      return callback({message: 'password error'});
    }
    var inputDate = {
      type: '0xe',
      nodeId: node
    };
    utils.generateSignedSpecialTx(address, password, gasPrice, gasLimit, inputDate, function(err, tx) {
      if(err) {
        return callback(err);
      }
      utils.sendTransaction(tx, callback);
    });
  }

  getNodeToken(configPath, address, callback) {
    try {
      if(!address.startsWith('0x')) {
        address = '0x' + address;
      }
      let config = this._readConfig(configPath);
      let privKey = new Buffer(config.networkPrivateKey, 'hex');
      let hash = ethUtil.keccak256(`${utils.getNodeID(config.networkPrivateKey)}${address}`);
      let sig = ethUtil.ecsign(hash, privKey);
      callback(null, ethUtil.toRpcSig(sig.v, sig.r, sig.s));
    } catch(e) {
      callback(e);
    } 
  }

  /**
   * Returns the number of nodes currently running
   * @private
   */
  get running() {
    let i = 0;

    for (let [, share] of this.shares) {
      if (share.readyState !== 1) {
        continue;
      } else {
        i++;
      }
    }

    return i;
  }

  get methods() {
    return {
      start: this.start.bind(this),
      stop: this.stop.bind(this),
      restart: this.restart.bind(this),
      status: this.status.bind(this),
      killall: this.killall.bind(this),
      destroy: this.destroy.bind(this),
      save: this.save.bind(this),
      load: this.load.bind(this),
      createWallet: this.createWallet.bind(this),
      createWalletByPrivateKey: this.createWalletByPrivateKey.bind(this),
      listWallets: this.listWallets.bind(this),
      deleteWallet: this.deleteWallet.bind(this),
      stake: this.stake.bind(this),
      addNode: this.addNode.bind(this),
      removeNode: this.removeNode.bind(this),
      getNodeToken: this.getNodeToken.bind(this)
    };
  }

}

RPC.SHARE_STARTED = 1;
RPC.SHARE_STOPPED = 0;
RPC.SHARE_ERRORED = 2;
RPC.MAX_RESTARTS = 30;

module.exports = RPC;
