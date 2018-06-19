'use strict'

var NetworkManager = require('../network_manager');
const url = 'https://victor.trustnote.org/tn';
const ObjLogin = require('../tools/objLogin');
var DataBase = require('../db/database');


const networkManager = new NetworkManager()
const db = new DataBase();

async function test (){
    await networkManager.connectToHub(url);
    let version = {
        "protocol_version": "1.0",
        "alt": "1",
        "library": "trustnote-common",
        "library_version": "0.1.1111111111111",
        "program": "TTT",
        "program_version": "1.1.1"
    }
    await networkManager.sendVersion(version);
    let ret1 = await networkManager.sendRequest('get_witnesses', null, false);
    await db.insertWitnesses(ret1.response);
    
    let arrWitnesses = await db.readMyWitnesses();
    // let arrWitnesses = ret1.response;
    console.log('arrWitnesses: ', arrWitnesses);


    let challenge = networkManager.fetchChallenge();
    console.log('challenge: ', challenge );

    var objLogin = ObjLogin.getObjLogin(challenge);
    await networkManager.sendJustsaying('hub/login', objLogin);

    let ret3 =  await networkManager.sendRequest('hub/temp_pubkey', ObjLogin.createTempPubkeyPackage(), false);
    console.log('hub/temp_pubkey: ',ret3.response)


    let addresses = ['6WWY5ULVLEMKY4J7EV5JTU2UER4GNZDO']
    // 'QWVH56KBONKG7BIOZ7LJMYLLQJHQAWWU'];

    let known_stable_units = ['33cs5A6tioSR94Pw6EAi0eRwdqA9XFnC5ZdCfyngAI0=']
    var objRequest = {
        witnesses: arrWitnesses,
        addresses: addresses,
        last_stable_mci: 0,
        known_stable_units: known_stable_units 
    }
    let ret4 = await networkManager.sendRequest('light/get_history', objRequest, false);
    console.log('light/get_history-------',JSON.stringify(ret4.response, null, 3));

    await db.saveLightHistory(ret4.response);


    var obj = {};
    obj.witnesses = arrWitnesses;
    let ret5 = await networkManager.sendRequest('light/get_parents_and_last_ball_and_witness_list_unit', obj, false);
    console.log('light/get_parents_and_last_ball_and_witness_list_unit-------',JSON.stringify(ret5.response, null, 3));
}

// test ();
