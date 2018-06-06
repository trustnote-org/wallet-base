'use strict'

var Bitcore = require("bitcore-lib");
var crypto = require("crypto");
var ecdsa = require('secp256k1');
var ecdsaSig = require('../crypto/signature.js');
var Mnemonic = require("bitcore-mnemonic");
var objectHash = require("../crypto/object_hash");
var objectLength = require("../crypto/object_length");

var objMyPermanentDeviceKey;

function getObjLogin (challenge) {
    var mnemonic = new Mnemonic(); // generates new mnemonic
    var passphrase = '';
    var xPrivKey = mnemonic.toHDPrivateKey();
    var devicePrivKey = xPrivKey.derive("m/1'").privateKey.bn.toBuffer({size:32});


    objMyPermanentDeviceKey = {
        priv: devicePrivKey,
        pub_b64: ecdsa.publicKeyCreate(devicePrivKey, true).toString('base64')
    };
    
    var objLogin = {challenge: challenge, pubkey: objMyPermanentDeviceKey.pub_b64};
    var buf_to_sign = new Buffer(objectHash.getDeviceMessageHashToSign(objLogin), "base64");
    objLogin.signature = ecdsaSig.sign(buf_to_sign, objMyPermanentDeviceKey.priv);

    return objLogin
}

var wallet = require('../wallet');
var Client = new wallet();
var info = {};
info.genPrivKey = Client.genPrivKey();
info.genPubKey = Client.genPubKey(info.genPrivKey);

var objMyTempDeviceKey = {
        pub_b64: info.genPubKey
    };

// objMyTempDeviceKey.pub_b64
function createTempPubkeyPackage(){
    var objTempPubkey = {
        temp_pubkey: objMyTempDeviceKey.pub_b64, 
        pubkey: objMyPermanentDeviceKey.pub_b64
    };
    var buf_to_sign = new Buffer(objectHash.getDeviceMessageHashToSign(objTempPubkey), 'base64');
    objTempPubkey.signature = ecdsaSig.sign(buf_to_sign, objMyPermanentDeviceKey.priv);
    return objTempPubkey;
}


exports.getObjLogin = getObjLogin;
exports.createTempPubkeyPackage = createTempPubkeyPackage;




