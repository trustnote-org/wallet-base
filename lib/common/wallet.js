"use strict";

// function composePaymentJoint(arrFromAddresses, arrOutputs, signer, callbacks){
//     composeJoint({paying_addresses: arrFromAddresses, outputs: arrOutputs, signer: signer, callbacks: callbacks});
// }
      //asset, wallet_id, to_address, amount, change_address, [], device_address,  signWithLocalPrivateKey,
function sendPaymentFromWallet(
        asset, wallet, to_address, amount, change_address, arrSigningDeviceAddresses, recipient_device_address, signWithLocalPrivateKey, handleResult)
{
    sendMultiPayment({
        asset: asset,
        wallet: wallet,
        to_address: to_address,
        amount: amount,
        change_address: change_address,
        arrSigningDeviceAddresses: arrSigningDeviceAddresses, //[]
        recipient_device_address: recipient_device_address,//device_address
        signWithLocalPrivateKey: signWithLocalPrivateKey // a function 
    }, handleResult);
}

function sendMultiPayment(opts, handleResult)
{
    var asset = opts.asset;
    if (asset === 'base')
        asset = null;
    var wallet = opts.wallet; //wallet_id;
    var arrPayingAddresses = opts.paying_addresses; //undefined
    var fee_paying_wallet = opts.fee_paying_wallet; //undefined
    var arrSigningAddresses = opts.signing_addresses || []; //[]
    var to_address = opts.to_address; // 'xxxxxxxxxxxxxx'
    var amount = opts.amount;         // '10000' 
    var bSendAll = opts.send_all;     // undefined
    var change_address = opts.change_address; //'xxxxxxxxxxxxx'
    var arrSigningDeviceAddresses = opts.arrSigningDeviceAddresses; // []
    var recipient_device_address = opts.recipient_device_address; // null
    var signWithLocalPrivateKey = opts.signWithLocalPrivateKey; // a function
    var merkle_proof = opts.merkle_proof; //undefined
    
    var base_outputs = opts.base_outputs;    //undefined
    var asset_outputs = opts.asset_outputs;  //undefined 
    var messages = opts.messages;            //undefined
    
    if (!wallet && !arrPayingAddresses)
        throw Error("neither wallet id nor paying addresses");
    if (wallet && arrPayingAddresses)
        throw Error("both wallet id and paying addresses");
    if ((to_address || amount) && (base_outputs || asset_outputs))
        throw Error('to_address and outputs at the same time');
    if (!asset && asset_outputs)
        throw Error('base asset and asset outputs');
    if (amount){
        if (typeof amount !== 'number')
            throw Error('amount must be a number');
        if (amount < 0)
            throw Error('amount must be positive');
    }
    
    var estimated_amount = amount;
    if (!estimated_amount && asset_outputs)
        estimated_amount = asset_outputs.reduce(function(acc, output){ return acc+output.amount; }, 0);
    if (estimated_amount && !asset)
        estimated_amount += TYPICAL_FEE;
    
    // readFundedAndSigningAddresses(
    //     asset, wallet || arrPayingAddresses, estimated_amount, fee_paying_wallet, arrSigningAddresses, arrSigningDeviceAddresses, 
    //     function(arrFundedAddresses, arrBaseFundedAddresses, arrAllSigningAddresses){
        
    //         if (arrFundedAddresses.length === 0)
    //             return handleResult("There are no funded addresses");
    //         if (asset && arrBaseFundedAddresses.length === 0)
    //             return handleResult("No notes to pay fees");

    //         var bRequestedConfirmation = false;
    //         var signer = {
    //             readSigningPaths: function(conn, address, handleLengthsBySigningPaths){ // returns assoc array signing_path => length
    //                 readFullSigningPaths(conn, address, arrSigningDeviceAddresses, function(assocTypesBySigningPaths){
    //                     var assocLengthsBySigningPaths = {};
    //                     for (var signing_path in assocTypesBySigningPaths){
    //                         var type = assocTypesBySigningPaths[signing_path];
    //                         if (type === 'key')
    //                             assocLengthsBySigningPaths[signing_path] = constants.SIG_LENGTH;
    //                         else if (type === 'merkle'){
    //                             if (merkle_proof)
    //                                 assocLengthsBySigningPaths[signing_path] = merkle_proof.length;
    //                         }
    //                         else
    //                             throw Error("unknown type "+type+" at "+signing_path);
    //                     }
    //                     handleLengthsBySigningPaths(assocLengthsBySigningPaths);
    //                 });
    //             },
    //             readDefinition: function(conn, address, handleDefinition){
    //                 conn.query(
    //                     "SELECT definition FROM my_addresses WHERE address=? UNION SELECT definition FROM shared_addresses WHERE shared_address=?", 
    //                     [address, address], 
    //                     function(rows){
    //                         if (rows.length !== 1)
    //                             throw Error("definition not found");
    //                         handleDefinition(null, JSON.parse(rows[0].definition));
    //                     }
    //                 );
    //             },
    //             sign: function(objUnsignedUnit, assocPrivatePayloads, address, signing_path, handleSignature){
    //                 var buf_to_sign = objectHash.getUnitHashToSign(objUnsignedUnit);
    //                 findAddress(address, signing_path, {
    //                     ifError: function(err){
    //                         throw Error(err);
    //                     },
    //                     ifUnknownAddress: function(err){
    //                         throw Error("unknown address "+address+" at "+signing_path);
    //                     },
    //                     ifLocal: function(objAddress){
    //                         signWithLocalPrivateKey(objAddress.wallet, objAddress.account, objAddress.is_change, objAddress.address_index, buf_to_sign, function(sig){
    //                             handleSignature(null, sig);
    //                         });
    //                     },
    //                     ifRemote: function(device_address){
    //                         // we'll receive this event after the peer signs
    //                         eventBus.once("signature-"+device_address+"-"+address+"-"+signing_path+"-"+buf_to_sign.toString("base64"), function(sig){
    //                             handleSignature(null, sig);
    //                             if (sig === '[refused]')
    //                                 eventBus.emit('refused_to_sign', device_address);
    //                         });
    //                         walletGeneral.sendOfferToSign(device_address, address, signing_path, objUnsignedUnit, assocPrivatePayloads);
    //                         if (!bRequestedConfirmation){
    //                             eventBus.emit("confirm_on_other_devices");
    //                             bRequestedConfirmation = true;
    //                         }
    //                     },
    //                     ifMerkle: function(bLocal){
    //                         if (!bLocal)
    //                             throw Error("merkle proof at path "+signing_path+" should be provided by another device");
    //                         if (!merkle_proof)
    //                             throw Error("merkle proof at path "+signing_path+" not provided");
    //                         handleSignature(null, merkle_proof);
    //                     }
    //                 });
    //             }
    //         };

    //         var params = {
    //             available_paying_addresses: arrFundedAddresses, // forces 'minimal' for payments from shared addresses too, it doesn't hurt
    //             signing_addresses: arrAllSigningAddresses,
    //             messages: messages, 
    //             signer: signer, 
    //             callbacks: {
    //                 ifNotEnoughFunds: function(err){
    //                     handleResult(err);
    //                 },
    //                 ifError: function(err){
    //                     handleResult(err);
    //                 },
    //                 // for asset payments, 2nd argument is array of chains of private elements
    //                 // for base asset, 2nd argument is assocPrivatePayloads which is null
    //                 ifOk: function(objJoint, arrChainsOfRecipientPrivateElements, arrChainsOfCosignerPrivateElements){
    //                     network.broadcastJoint(objJoint);
    //                     if (!arrChainsOfRecipientPrivateElements && recipient_device_address) // send notification about public payment
    //                         walletGeneral.sendPaymentNotification(recipient_device_address, objJoint.unit.unit);
    //                     handleResult(null, objJoint.unit.unit);
    //                 }
    //             }
    //         };

    //         if (asset){
    //             if (bSendAll)
    //                 throw Error('send_all with asset');
    //             params.asset = asset;
    //             params.available_fee_paying_addresses = arrBaseFundedAddresses;
    //             if (to_address){
    //                 params.to_address = to_address;
    //                 params.amount = amount; // in asset units
    //             }
    //             else{
    //                 params.asset_outputs = asset_outputs;
    //                 params.base_outputs = base_outputs; // only destinations, without the change
    //             }
    //             params.change_address = change_address;
    //             storage.readAsset(db, asset, null, function(err, objAsset){
    //                 if (err)
    //                     throw Error(err);
    //             //  if (objAsset.is_private && !recipient_device_address)
    //             //      return handleResult("for private asset, need recipient's device address to send private payload to");
    //                 if (objAsset.is_private){
    //                     // save messages in outbox before committing
    //                     params.callbacks.preCommitCb = function(conn, arrChainsOfRecipientPrivateElements, arrChainsOfCosignerPrivateElements, cb){
    //                         if (!arrChainsOfRecipientPrivateElements || !arrChainsOfCosignerPrivateElements)
    //                             throw Error('no private elements');
    //                         var sendToRecipients = function(cb2){
    //                             if (recipient_device_address)
    //                                 walletGeneral.sendPrivatePayments(recipient_device_address, arrChainsOfRecipientPrivateElements, false, conn, cb2);
    //                             else // paying to another wallet on the same device
    //                                 forwardPrivateChainsToOtherMembersOfOutputAddresses(arrChainsOfRecipientPrivateElements, conn, cb2);
    //                         };
    //                         var sendToCosigners = function(cb2){
    //                             if (wallet)
    //                                 walletDefinedByKeys.forwardPrivateChainsToOtherMembersOfWallets(arrChainsOfCosignerPrivateElements, [wallet], conn, cb2);
    //                             else // arrPayingAddresses can be only shared addresses
    //                                 walletDefinedByAddresses.forwardPrivateChainsToOtherMembersOfAddresses(arrChainsOfCosignerPrivateElements, arrPayingAddresses, conn, cb2);
    //                         };
    //                         async.series([sendToRecipients, sendToCosigners], cb);
    //                     };
    //                 }
    //                 if (objAsset.fixed_denominations){ // indivisible
    //                     params.tolerance_plus = 0;
    //                     params.tolerance_minus = 0;
    //                     indivisibleAsset.composeAndSaveMinimalIndivisibleAssetPaymentJoint(params);
    //                 }
    //                 else{ // divisible
    //                     divisibleAsset.composeAndSaveMinimalDivisibleAssetPaymentJoint(params);
    //                 }
    //             });
    //         }
    //         else{ // base asset
    //             if (bSendAll){
    //                 params.send_all = bSendAll;
    //                 params.outputs = [{address: to_address, amount: 0}];
    //             }
    //             else{
    //                 params.outputs = to_address ? [{address: to_address, amount: amount}] : (base_outputs || []);
    //                 if(opts.candyOutput && opts.candyOutput.length > 1) {
    //                     params.outputs = opts.candyOutput;
    //                 }
    //                 params.outputs.push({address: change_address, amount: 0});
    //             }
    //             composer.composeAndSaveMinimalJoint(params);
    //         }

    //     }
    // );
}


/*
walletGeneral.readMyAddresses(function(arrAddresses){
    network.setWatchedAddresses(arrAddresses);
})
*/


exports.sendPaymentFromWallet = sendPaymentFromWallet;
exports.sendMultiPayment = sendMultiPayment;