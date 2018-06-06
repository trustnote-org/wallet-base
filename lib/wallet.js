"use strict"

var Bitcore = require("bitcore-lib");
var crypto = require("crypto");
var ecdsa = require('secp256k1');
var Mnemonic = require("bitcore-mnemonic");
var objectHash = require("./crypto/object_hash");
var objectLength = require("./crypto/object_length");

class Wallet {
    constructor () {
        this.networkManager = null
    }

  //生成助记词
    mnemonic () {
        try {
            var mnemonic = new Mnemonic();
            return mnemonic.phrase;
        } catch (error) {
            return 0;
        }
    }

    //根据助记词生成根私钥
    xPrivKey (mnemonic) {
        try {
            var xPrivKey = new Mnemonic(mnemonic).toHDPrivateKey();
            return xPrivKey.toString();
        } catch (error) {
            return 0;
        }
    }

    //根据私钥生成私钥对象结构
    objPrivKey (xPrivKey) {
        try {
            var objPrivKey = new Bitcore.HDPrivateKey.fromString(xPrivKey);
            return objPrivKey;
        } catch (error) {
            return 0;
        }
    }

    //根公钥
    xPubKey (xPrivKey) {
        try {
            var xPubKey = Bitcore.HDPublicKey(Bitcore.HDPrivateKey.fromString(xPrivKey));
            return xPubKey.toString();
        } catch (error) {
            return 0;
        }
    }

    //钱包公钥
    walletPubKey (xPrivKey, num) {
        try {
            xPrivKey = Bitcore.HDPrivateKey.fromString(xPrivKey);
            var wallet_xPubKey = Bitcore.HDPublicKey(xPrivKey.derive("m/44'/0'/" + num + "'"));
            return wallet_xPubKey.toString();
        } catch (error) {
            return 0;
        }
    }

    //钱包ID
    walletID  (walletPubKey) {
        try {
            var wallet_Id = crypto.createHash("sha256").update(walletPubKey, "utf8").digest("base64");
            return wallet_Id;
        } catch (error) {
            return 0;
        }
    }

    //生成设备地址
    deviceAddress (xPrivKey) {
        try {
            xPrivKey = Bitcore.HDPrivateKey.fromString(xPrivKey);
            var priv_key = xPrivKey.derive("m/1'").privateKey.bn.toBuffer({
                size: 32
            });
            var pub_b64 = ecdsa.publicKeyCreate(priv_key, true).toString('base64');
            var device_address = objectHash.getDeviceAddress(pub_b64);
            return device_address;
        } catch (error) {
            return 0;
        }
    }

    //生成钱包的地址
    walletAddress (wallet_xPubKey, change, num) {
        try {
            wallet_xPubKey = Bitcore.HDPublicKey.fromString(wallet_xPubKey);
            var wallet_xPubKey_base64 = wallet_xPubKey.derive("m/" + change + "/" + num).publicKey.toBuffer().toString("base64");
            var address = objectHash.getChash160(["sig", {
                "pubkey": wallet_xPubKey_base64
            }]);
            return address;
        } catch (error) {
            return 0;
        }
    }

    //生成钱包地址对应的公钥
    walletAddressPubkey (wallet_xPubKey, change, num) {
        try {
            wallet_xPubKey = Bitcore.HDPublicKey.fromString(wallet_xPubKey);
            var wallet_xPubKey_base64 = wallet_xPubKey.derive("m/" + change + "/" + num).publicKey.toBuffer().toString("base64");
            return wallet_xPubKey_base64;
        } catch (error) {
            return 0;
        }
    }

    //签名
    sign (b64_hash, xPrivKey, path) {
        try {
            var buf_to_sign = new Buffer(b64_hash, "base64");
            if (path != "null") {
                var xPrivKey = new Bitcore.HDPrivateKey.fromString(xPrivKey);
                var privateKey = xPrivKey.derive(path).privateKey;
                var privKeyBuf = privateKey.bn.toBuffer({
                    size: 32
                });
            } else {
                var privKeyBuf = new Buffer(xPrivKey, "base64");
            }
            var res = ecdsa.sign(buf_to_sign, privKeyBuf);
            return res.signature.toString("base64");
        } catch (error) {
            return 0;
        }
    }

    //验证签名
    verify (b64_hash, sig, pub_key) {
        try {
            var buf_to_verify = new Buffer(b64_hash, "base64");
            var signature = new Buffer(sig, "base64"); // 64 bytes (32+32)
            if (ecdsa.verify(buf_to_verify, signature, new Buffer(pub_key, "base64")))
                return 1;
            else
                return 0;
        } catch (errer) {
            return 0;
        }
    }

    //生成ecdsa签名公钥
    ecdsaPubkey (xPrivKey, path) {
        try {
            if (path != "null") {
                xPrivKey = Bitcore.HDPrivateKey.fromString(xPrivKey);
                var priv_key = xPrivKey.derive(path).privateKey.bn.toBuffer({
                    size: 32
                });
            } else {
                var priv_key = new Buffer(xPrivKey, "base64");
            }
            var pub_b64 = ecdsa.publicKeyCreate(priv_key, true).toString('base64');
            return pub_b64;
        } catch (error) {
            return 0;
        }
    }

    //生成m/1'私钥
    m1PrivKey (xPrivKey) {
        try {
            var xPrivKey = new Bitcore.HDPrivateKey.fromString(xPrivKey);
            var privateKey = xPrivKey.derive("m/1'").privateKey;
            var privKeyBuf = privateKey.bn.toBuffer({
                size: 32
            });
            return privKeyBuf.toString("base64");
        } catch (error) {
            return 0;
        }
    }

    //生成临时私钥
    genPrivKey () {
        var privKey;
        try {
            do {
                privKey = crypto.randomBytes(32);
            }
            while (!ecdsa.privateKeyVerify(privKey));
            return privKey.toString("base64");
        } catch (error) {
            return 0;
        }
    }

    //根据临时私钥生成公钥
    genPubKey (privKey) {
        try {
            var pubKey = ecdsa.publicKeyCreate(new Buffer(privKey, "base64"), true).toString('base64');
            return pubKey;
        } catch (error) {
            return 0;
        }
    }

    getDeviceMessageHashToSign (objDeviceMessage)  {
       return objectHash.getDeviceMessageHashToSign(objDeviceMessage);
    }

    getUnitHashToSign (objUnit) {
       return objectHash.getUnitHashToSign(objUnit);
    }

    getBase64Hash (objUnit) {
        return objectHash.getBase64Hash(objUnit);
    }

    getUnitHash (objUnit) { 
        return objectHash.getUnitHash(objUnit);
    }

    getHeadersSize (objUnit) {
        return objectLength.getHeadersSize(objUnit);
    }

    getTotalPayloadSize (objUnit) {
        return objectLength.getTotalPayloadSize(objUnit);
    }
};

module.exports = Wallet;