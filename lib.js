"use strict"
var Bitcore = require("bitcore-lib");
var crypto = require("crypto");
var ecdsa = require('secp256k1');
var Mnemonic = require("bitcore-mnemonic");
var objectHash = require("./object_hash");
var objectLength = require("./object_length");
var validation = require("./validation");

var Base = {};

Base.getDeviceAddress = objectHash.getDeviceAddress;
Base.getDeviceMessageHashToSign = objectHash.getDeviceMessageHashToSign;
Base.getUnitHashToSign = objectHash.getUnitHashToSign;
Base.getBase64Hash = objectHash.getBase64Hash;
Base.getUnitHash = objectHash.getUnitHash;

Base.getHeadersSize = objectLength.getHeadersSize;
Base.getTotalPayloadSize = objectLength.getTotalPayloadSize;

Base.isValidAddress = validation.isValidAddress;

//生成随机数
Base.randomBytes = function (num) {
    try {
        var random_base64 = crypto.randomBytes(num).toString("base64");
        return random_base64;
    } catch (error) {
        return "0";
    }
}

//生成助记词
Base.mnemonic = function (mnemonic) {
    try {
        var mnemonic = new Mnemonic(mnemonic);
        return mnemonic.phrase;
    } catch (error) {
        return "0";
    }
}

//根据助记词生成根私钥
Base.xPrivKey = function (mnemonic, password) {
    try {
        var xPrivKey = new Mnemonic(mnemonic).toHDPrivateKey(password);
        return xPrivKey.toString();
    } catch (error) {
        return "0";
    }
}

//根据私钥生成私钥对象结构
Base.objPrivKey = function (xPrivKey) {
    try {
        var objPrivKey = new Bitcore.HDPrivateKey.fromString(xPrivKey);
        return objPrivKey;
    } catch (error) {
        return "0";
    }
}

//根公钥
Base.xPubKey = function (xPrivKey) {
    try {
        var xPubKey = Bitcore.HDPublicKey(Bitcore.HDPrivateKey.fromString(xPrivKey));
        return xPubKey.toString();
    } catch (error) {
        return "0";
    }
}

//钱包公钥
Base.walletPubKey = function (xPrivKey, num) {
    try {
        xPrivKey = Bitcore.HDPrivateKey.fromString(xPrivKey);
        var wallet_xPubKey = Bitcore.HDPublicKey(xPrivKey.derive("m/44'/0'/" + num + "'"));
        return wallet_xPubKey.toString();
    } catch (error) {
        return "0";
    }
}

//钱包ID
Base.walletID = function (walletPubKey) {
    try {
        var wallet_Id = crypto.createHash("sha256").update(walletPubKey, "utf8").digest("base64");
        return wallet_Id;
    } catch (error) {
        return "0";
    }
}

//生成设备地址
Base.deviceAddress = function (xPrivKey) {
    try {
        xPrivKey = Bitcore.HDPrivateKey.fromString(xPrivKey);
        var priv_key = xPrivKey.derive("m/1'").privateKey.bn.toBuffer({
            size: 32
        });
        var pub_b64 = ecdsa.publicKeyCreate(priv_key, true).toString('base64');
        var device_address = objectHash.getDeviceAddress(pub_b64);
        return device_address;
    } catch (error) {
        return "0";
    }
}

//生成钱包的地址
Base.walletAddress = function (wallet_xPubKey, change, num) {
    try {
        wallet_xPubKey = Bitcore.HDPublicKey.fromString(wallet_xPubKey);
        var wallet_xPubKey_base64 = wallet_xPubKey.derive("m/" + change + "/" + num).publicKey.toBuffer().toString("base64");
        var address = objectHash.getChash160(["sig", {
            "pubkey": wallet_xPubKey_base64
        }]);
        return address;
    } catch (error) {
        return "0";
    }
}

//生成钱包地址对应的公钥
Base.walletAddressPubkey = function (wallet_xPubKey, change, num) {
    try {
        wallet_xPubKey = Bitcore.HDPublicKey.fromString(wallet_xPubKey);
        var wallet_xPubKey_base64 = wallet_xPubKey.derive("m/" + change + "/" + num).publicKey.toBuffer().toString("base64");
        return wallet_xPubKey_base64;
    } catch (error) {
        return "0";
    }
}

//签名
Base.sign = function (b64_hash, xPrivKey, path) {
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
        return "0";
    }
}

//验证签名
Base.verify = function (b64_hash, sig, pub_key) {
    try {
        var buf_to_verify = new Buffer(b64_hash, "base64");
        var signature = new Buffer(sig, "base64"); // 64 bytes (32+32)
        if (ecdsa.verify(buf_to_verify, signature, new Buffer(pub_key, "base64")))
            return "1";
        else
            return "0";
    } catch (errer) {
        return "0";
    }
}

//生成ecdsa签名公钥
Base.ecdsaPubkey = function (xPrivKey, path) {
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
        return "0";
    }
}

//生成m/1'私钥
Base.m1PrivKey = function (xPrivKey) {
    try {
        var xPrivKey = new Bitcore.HDPrivateKey.fromString(xPrivKey);
        var privateKey = xPrivKey.derive("m/1'").privateKey;
        var privKeyBuf = privateKey.bn.toBuffer({
            size: 32
        });
        return privKeyBuf.toString("base64");
    } catch (error) {
        return "0";
    }
}

//生成临时私钥
Base.genPrivKey = function () {
    var privKey;
    try {
        do {
            privKey = crypto.randomBytes(32);
        }
        while (!ecdsa.privateKeyVerify(privKey));
        return privKey.toString("base64");
    } catch (error) {
        return "0";
    }
}

//根据临时私钥生成公钥
Base.genPubKey = function (privKey) {
    try {
        var pubKey = ecdsa.publicKeyCreate(new Buffer(privKey, "base64"), true).toString('base64');
        return pubKey;
    } catch (error) {
        return "0";
    }
}

Base.createEncryptedPackage = function (json, pubkey) {
    try {
        if (typeof (json) == "object")
            var text = JSON.stringify(json);
        else
            var text = json;

        var deriveSharedSecret = function (ecdh, peer_b64_pubkey) {
            var shared_secret_src = ecdh.computeSecret(peer_b64_pubkey, "base64");
            var shared_secret = crypto.createHash("sha256").update(shared_secret_src).digest().slice(0, 16);
            return shared_secret;
        }

        // console.log("will encrypt and send: "+text);
        var ecdh = crypto.createECDH('secp256k1');
        var sender_ephemeral_pubkey = ecdh.generateKeys("base64", "compressed");
        var shared_secret = deriveSharedSecret(ecdh, pubkey); // Buffer
        // console.log(shared_secret.length);
        // we could also derive iv from the unused bits of ecdh.computeSecret() and save some bandwidth
        var iv = crypto.randomBytes(12); // 128 bits (16 bytes) total, we take 12 bytes for random iv and leave 4 bytes for the counter
        var cipher = crypto.createCipheriv("aes-128-gcm", shared_secret, iv);
        // under browserify, encryption of long strings fails with Array buffer allocation errors, have to split the string into chunks
        var arrChunks = [];
        var CHUNK_LENGTH = 2003;
        for (var offset = 0; offset < text.length; offset += CHUNK_LENGTH) {
            //	console.log('offset '+offset);
            arrChunks.push(cipher.update(text.slice(offset, Math.min(offset + CHUNK_LENGTH, text.length)), 'utf8'));
        }
        arrChunks.push(cipher.final());
        var encrypted_message_buf = Buffer.concat(arrChunks);
        arrChunks = null;
        //	var encrypted_message_buf = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
        //console.log(encrypted_message_buf);
        var encrypted_message = encrypted_message_buf.toString("base64");
        //console.log(encrypted_message);
        var authtag = cipher.getAuthTag();
        // this is visible and verifiable by the hub
        var encrypted_package = {
            encrypted_message: encrypted_message,
            iv: iv.toString('base64'),
            authtag: authtag.toString('base64'),
            dh: {
                sender_ephemeral_pubkey: sender_ephemeral_pubkey,
                recipient_ephemeral_pubkey: pubkey
            }
        };
        return JSON.stringify(encrypted_package);
    } catch (error) {
        return "0";
    }
}

Base.decryptPackage = function (objEncryptedPackage, privKey, prePrivKey, m1PrivKey) {
    var priv_key;
    try {
        if (typeof (objEncryptedPackage) == "string")
            objEncryptedPackage = JSON.parse(objEncryptedPackage);

        if (privKey && prePrivKey && m1PrivKey) {
            var pubKey = Base.genPubKey(privKey);
            var prePubKey = Base.genPubKey(prePrivKey);
            var m1PubKey = Base.genPubKey(m1PrivKey);
        }
        if (objEncryptedPackage.dh.recipient_ephemeral_pubkey === pubKey) {
            priv_key = new Buffer(privKey, "base64");
            // console.log("message encrypted to temp key");
        } else if (prePrivKey && objEncryptedPackage.dh.recipient_ephemeral_pubkey === prePubKey) {
            priv_key = new Buffer(prePrivKey, "base64");
            // console.log("message encrypted to prev temp key");
            //console.log("objMyPrevTempDeviceKey: "+JSON.stringify(objMyPrevTempDeviceKey));
            //console.log("prev temp private key buf: ", priv_key);
            //console.log("prev temp private key b64: "+priv_key.toString('base64'));
        } else if (objEncryptedPackage.dh.recipient_ephemeral_pubkey === m1PubKey) {
            priv_key = new Buffer(m1PrivKey, "base64");
            // console.log("message encrypted to permanent key");
        } else {
            // console.log("message encrypted to unknown key");
            return "0";
        }

        var deriveSharedSecret = function (ecdh, peer_b64_pubkey) {
            var shared_secret_src = ecdh.computeSecret(peer_b64_pubkey, "base64");
            var shared_secret = crypto.createHash("sha256").update(shared_secret_src).digest().slice(0, 16);
            return shared_secret;
        }

        var ecdh = crypto.createECDH('secp256k1');
        ecdh.setPrivateKey(priv_key);
        var shared_secret = deriveSharedSecret(ecdh, objEncryptedPackage.dh.sender_ephemeral_pubkey);
        var iv = new Buffer(objEncryptedPackage.iv, 'base64');
        var decipher = crypto.createDecipheriv('aes-128-gcm', shared_secret, iv);
        var authtag = new Buffer(objEncryptedPackage.authtag, 'base64');
        decipher.setAuthTag(authtag);
        var enc_buf = Buffer(objEncryptedPackage.encrypted_message, "base64");
        //	var decrypted1 = decipher.update(enc_buf);
        // under browserify, decryption of long buffers fails with Array buffer allocation errors, have to split the buffer into chunks
        var arrChunks = [];
        var CHUNK_LENGTH = 4096;
        for (var offset = 0; offset < enc_buf.length; offset += CHUNK_LENGTH) {
            //	console.log('offset '+offset);
            arrChunks.push(decipher.update(enc_buf.slice(offset, Math.min(offset + CHUNK_LENGTH, enc_buf.length))));
        }
        var decrypted1 = Buffer.concat(arrChunks);
        arrChunks = null;
        var decrypted2 = decipher.final();
        var decrypted_message_buf = Buffer.concat([decrypted1, decrypted2]);
        var decrypted_message = decrypted_message_buf.toString("utf8");
        // console.log("decrypted: " + decrypted_message);
        var json = JSON.parse(decrypted_message);
        if (json.encrypted_package) { // strip another layer of encryption
            return Base.decryptPackage(json.encrypted_package, privKey, prePrivKey, m1PrivKey);
        } else
            return JSON.stringify(json);
    } catch (error) {
        return "0";
    }
}
module.exports = Base;
