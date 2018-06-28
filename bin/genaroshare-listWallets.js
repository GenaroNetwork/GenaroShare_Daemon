#!/usr/bin/env node

'use strict';

require('./globalsetting');
const { homedir } = require('os');
const fs = require('fs');
const path = require('path');
const walletManager = require("jswallet-manager");
const config = require('../lib/config/daemon');
const utils = require('../lib/utils');
const genaroshare_listWallets = require('commander');
const Table = require('cli-table');

const walletsPath = path.join(homedir(), '.sharertest');
if (!fs.existsSync(walletsPath)) {
    fs.mkdirSync(walletsPath);
}

var wm = walletManager.newWalletManager(walletsPath);

var wallets = [];
try {
    wallets = wm.listWallet();
} catch (e) {
    console.log('\n error:' + e);
    process.exit(1);
}

let table = new Table({
    head: ['Name', 'Address'],
    style: {
        head: ['cyan', 'bold'],
        border: []
    },
    colWidths: [50, 50]
});

wallets.forEach(w => {
    console.log(w);
    table.push([w.name || '', w.address || '']);
});

console.log('\n' + table.toString());
