
/*

async.series([
//     function(callback) {
//         // do some stuff ...
//         console.log('+++++++++++++++++++++one++++++++');
//         // callback('adsfdsafsdfsd', 'one');
//         // throw new Error("more");
//     },
//     function(callback) {
//         console.log('+++++++++++++++++++++two++++++++');
//         // do some more stuff ...
//         callback(null, 'two');
//     }
// ],
// // optional callback
// function(err, results) {
//     // results is now equal to ['one', 'two']
//     console.log('-------------err', err);
//     console.log('++++++++++++++results:',results);
// });

*/

/*
let asset = null;
let amount = 1000;
let to_address = '';
let change_address = '';
let device_address = null;

function onDone (err, unit) {
    console.log('err: ',err, '\nunit: ', unit);
}

sendPayment(asset, amount, to_address, change_address,  device_address, onDone);

// headlessWallet.issueChangeAddressAndSendPayment(null, amount, toAddress, null, function(err, unit) {

function signWithLocalPrivateKey(wallet_id, account, is_change, address_index, text_to_sign, handleSig){
    var path = "m/44'/0'/" + account + "'/"+is_change+"/"+address_index;
    var privateKey = xPrivKey.derive(path).privateKey;
    var privKeyBuf = privateKey.bn.toBuffer({size:32}); // https://github.com/bitpay/bitcore-lib/issues/47
    handleSig(ecdsaSig.sign(text_to_sign, privKeyBuf));
}

let wallet_id = '';

function sendPayment(asset, amount, to_address, change_address, device_address, onDone){
    // var device = require('./common/device.js');
    var Wallet = require('./common/wallet.js');
    Wallet.sendPaymentFromWallet(
        asset, wallet_id, to_address, amount, change_address,
        [], device_address,
        signWithLocalPrivateKey,
        function(err, unit){
            console.log('wallet sendPayment successfully !')
            console.log('err---------',err);
            console.log('unit--------',unit);
            // if (device_address) {
            //     if (err)
            //         device.sendMessageToDevice(device_address, 'text', "Failed to pay: " + err);
            //     else
            //     // if successful, the peer will also receive a payment notification
            //         device.sendMessageToDevice(device_address, 'text', "paid");
            // }
            // if (onDone)
            //     onDone(err, unit);
        }
    );
}




// function signWithLocalPrivateKey(wallet_id, account, is_change, address_index, text_to_sign, handleSig){
//     var path = "m/44'/0'/" + account + "'/"+is_change+"/"+address_index;
//     var privateKey = xPrivKey.derive(path).privateKey;
//     var privKeyBuf = privateKey.bn.toBuffer({size:32}); // https://github.com/bitpay/bitcore-lib/issues/47
//     handleSig(ecdsaSig.sign(text_to_sign, privKeyBuf));
// }
*/
