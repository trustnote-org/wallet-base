'use strict'

var Bitcore = require("bitcore-lib");
var crypto = require("crypto");
var ecdsa = require('secp256k1');
var ecdsaSig = require('../crypto/signature.js');
var Mnemonic = require("bitcore-mnemonic");
var objectHash = require("../crypto/object_hash");
var objectLength = require("../crypto/object_length");



var window = {};
var wallet = require('../wallet');
window.Client = new wallet();

var obj1 = {
    "version": "1.0",
    "alt": "1",
    "messages": [
        {
            "app": "payment",
            "payload_location": "inline",
            "payload_hash": "P46nXMzKXC2LDzXyMUYBDCXetrjchlcP3l0MLo4WORo=",
            "payload": {
                "outputs": [
                    {
                        "address": "YDKTOQ7VCBQ336VGH3S5RLIWRRAUTB5O",
                        "amount": 1000
                    },
                    {
                        "address": "ZXBUYS27ZS7QPISUGH3OBWFEPPYFLNHN",
                        "amount": 232957
                    }
                ],
                "inputs": [
                    {
                        "unit": "0qP+mIYs767MWotyHLtNmOSGSH6ISWGESC1+N1buaPs=",
                        "message_index": 0,
                        "output_index": 0
                    }
                ]
            }
        }
    ],
    "authors": [
        {
            "address": "7LA5PM2WUGONMSFLYRXFE3DY7X6ORKJW",
            "authentifiers": {
                "r": "cMKJdsCjSCg1iP9VLq6QFDlv3S6tRhKaXcmJhGTMWtxlKDg6tYn7Q7LqUamjRz7JMbSmAZCP/K1LM1vA1p+/wQ=="
            },
            "definition": [
                "sig",
                {
                    "pubkey": "A5YLk2BEKnOXjXINYIBWPkdYx67lHmsTYso4R+2OygDV"
                }
            ]
        }
    ],
    "parent_units": [
        "EYmSD9jUPMLidEXFIIuI6m/Wj9te3bHE8DouYheGzqQ="
    ],
    "last_ball": "bYY1fmND7WSE6zTSw0l0rs/queoaF83/y+OY4tuMhBs=",
    "last_ball_unit": "sf6F/Rjb7K/5j/GMa3XtLu6JrPCDraeOGBEX/9+FQG8=",
    "witness_list_unit": "rg1RzwKwnfRHjBojGol3gZaC5w7kR++rOR6O61JRsrQ=",
    "headers_commission": 391,
    "payload_commission": 197
}

var info = {};

info.unitHash = window.Client.getUnitHash(obj1);
info.totalPayloadSize = window.Client.getTotalPayloadSize(obj1);

// 助记词 ==> 私钥 ==> 公钥 ==> 钱包地址 ==> 钱包ID
info.mnemonic = window.Client.mnemonic();
info.xPrivKey = window.Client.xPrivKey(info.mnemonic);
info.xPubKey = window.Client.xPubKey(info.xPrivKey);

info.walletPubKey = window.Client.walletPubKey(info.xPrivKey, 0);
info.walletAddress = window.Client.walletAddress(info.walletPubKey, 0, 0);
info.walletID = window.Client.walletID(info.walletAddress);

info.m1PrivKey = window.Client.m1PrivKey(info.xPrivKey);
info.genPrivKey = window.Client.genPrivKey();
info.genPubKey = window.Client.genPubKey(info.genPrivKey);

info.getUnitHashToSign = window.Client.getUnitHashToSign(obj1);


info.ecdsaPubkey = window.Client.ecdsaPubkey(info.xPrivKey,  "m/44/0'/0'/1/13");
//签名
info.sign = window.Client.sign(info.getUnitHashToSign, info.xPrivKey, "m/44/0'/0'/1/13");
//验证签名
info.ret = window.Client.verify(info.getUnitHashToSign, info.sign, info.ecdsaPubkey);

console.log('--------------------------->')
console.log(JSON.stringify(info,null,3));


function getObjLogin (challenge) {
    var mnemonic = new Mnemonic(); // generates new mnemonic
    var passphrase = '';
    var xPrivKey = mnemonic.toHDPrivateKey();
    var devicePrivKey = xPrivKey.derive("m/1'").privateKey.bn.toBuffer({size:32});


    var objMyPermanentDeviceKey = {
        priv: devicePrivKey,
        pub_b64: ecdsa.publicKeyCreate(devicePrivKey, true).toString('base64')
    };
    
    var objLogin = {challenge: challenge, pubkey: objMyPermanentDeviceKey.pub_b64};
    var buf_to_sign = new Buffer(objectHash.getDeviceMessageHashToSign(objLogin), "base64");
    objLogin.signature = ecdsaSig.sign(buf_to_sign, objMyPermanentDeviceKey.priv);

    return objLogin
}

