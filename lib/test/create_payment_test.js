"use strict";

var headlessWallet = require('../headless/headlessWallet.js');
var composer = require('../common/composer.js');


function onError(err){
    throw Error(err);
}

function createPayment(){

    // var callbacks = composer.getSavingCallbacks({
    //     ifNotEnoughFunds: onError,
    //     ifError: onError,
    //     ifOk: function(objJoint){
    //         network.broadcastJoint(objJoint);
    //     }
    // });

    var callbacks = function () {
        console.log('------------------------------------');
    }

    var from_address = '6WWY5ULVLEMKY4J7EV5JTU2UER4GNZDO';
    
    var outputs = [
        {address: from_address, amount: 0},                           // the change
        {address: 'EEQS6IBV7SCLB6ROROVP2WYJHP536WC6', amount: 8}  // the receiver
    ];

    var witnesses =  
         ['2SATGZDFDXNNJRVZ52O4J6VYTTMO2EZR',
          '33RVJX3WBNZXJOSFCU6KK7O7TVEXLXGR',
          'FYQXBPQWBPXWMJGCHWJ52AK2QMEOICR5',
          'J3XIKRBU4BV2PX2BP4PSGIXDVND2XRIF',
          'K5JWBZBADITKZAZDTHAPCU5FLYVSM752',
          'KM5FZPIP264YRRWRQPXF7F7Y6ETDEW5Y',
          'NBEFJ3LKG2SBSBK7D7GCFREOAFMS7QTQ',
          'RIHZR7AHPVKZWTTDWI6UTKC7L73BJJQW',
          'TIPXQ4CAO7G4C4P2P4PEN2KQK4MY73WD',
          'X27CW2UWU5SGE647LK5SBTIPOOIQ7GJT',
          'X6DWZUEW4IBFR77I46CAKTJVK4DBPOHE',
          'XIM76DRNUNFWPXPI5AGOCYNMA3IOXL7V']

    var lightProps =
        {
           "parent_units": [
              "QQgPbBDvhM83hopAstmIbOw16MOKxPTBtpprUPEr0AQ=",
              "z8MbR1cbBFjTUmHQuUSMOO4dwEWxd+/Dm6Ds6FeHdb4="
           ],
           "last_stable_mc_ball": "jEDL9JXuRdleroHRY7l5jSlf+b1hMZr1PTq6CPWox4w=",
           "last_stable_mc_ball_unit": "NIoTU+pwysAW0cpeYWN80Mma9V0cNJaYf46qLzk1MAU=",
           "last_stable_mc_ball_mci": 266423,
           "witness_list_unit": "rg1RzwKwnfRHjBojGol3gZaC5w7kR++rOR6O61JRsrQ="
        }

    let params = {};
    params.paying_addresses = [ from_address ];
    params.outputs = outputs;
    params.witnesses = witnesses;
    params.signer = headlessWallet.signer;
    params.lightProps = lightProps;

    params.callbacks = callbacks;

    composer.composeJoint(params);
}



createPayment();



