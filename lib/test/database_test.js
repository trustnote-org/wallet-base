'use strict'

var DataBase = require('../db/database');

async function test () {
    let db = new DataBase();
    let arrWitnesses = await db.readMyWitnesses();
    console.log('--------arrWitnesses---',arrWitnesses);

    var Wallet = require('../wallet');
    let wallet = new Wallet();

    // 助记词 ==> 私钥 ==> 公钥 ==> 钱包地址 ==> 钱包ID
    let info = {};
    info.mnemonic = wallet.mnemonic();
    info.xPrivKey = wallet.xPrivKey(info.mnemonic);
    info.xPubKey = wallet.xPubKey(info.xPrivKey);

    info.walletPubKey = wallet.walletPubKey(info.xPrivKey, 0);
    info.walletAddress = wallet.walletAddress(info.walletPubKey, 0, 0);
    info.walletID = wallet.walletID(info.walletAddress);
    info.walletAddressPubkey = wallet.walletAddressPubkey(info.walletPubKey,0, 0)

    let walletID = info.walletID;
    let is_change = 0;
    let address_index = 0;
    let address = info.walletAddress;
    var arrDefinition = ['sig', {pubkey: info.walletAddressPubkey }];    

    // await db.insertMyAddresses(walletID, is_change, address_index, address, arrDefinition );
    // let addresses = ['WP2JOUJQ24YEECSEXQIZWKYJ5HTBTE4K', 'QWVH56KBONKG7BIOZ7LJMYLLQJHQAWWU'];
    // let known_stable_units =  await db.readKnownStableUnits(addresses);
    // console.log(known_stable_units);
    
    const lightHistoryResponse = require('./light_history_test');
    console.log('joints  units count: ', lightHistoryResponse.joints.length);
    await db.saveLightHistory(lightHistoryResponse);
}

test ();