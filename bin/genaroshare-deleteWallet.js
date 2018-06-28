#!/usr/bin/env node

'use strict';

require('./globalsetting');
const { homedir } = require('os');
const fs = require('fs');
const path = require('path');
const walletManager = require("jswallet-manager");
const config = require('../lib/config/daemon');
const utils = require('../lib/utils');
const genaroshare_deleteWallet = require('commander');

const walletsPath = path.join(homedir(), '.sharertest');
if (!fs.existsSync(walletsPath)) {
    fs.mkdirSync(walletsPath);
}

genaroshare_deleteWallet
    .description('delete wallet')
    .option('-a, --address <address>', 'wallet address')
    .parse(process.argv);

if (!genaroshare_deleteWallet.address) {
    console.error('\n  no address was given, try --help');
    process.exit(1);
}

var wm = walletManager.newWalletManager(walletsPath);

try {
    wm.deleteWallet(genaroshare_deleteWallet.address);
} catch (e) {
    console.log('\n error:' + e);
    process.exit(1);
}

console.log('\n Your have deleted the wallet: ' + genaroshare_deleteWallet.address);
