'use strict'

const url = 'http://119.28.27.234:6552';
// const request = require('request-promise-native');
/*
async function test () {
    let opt = {
        url : url,
        method : 'POST'
    };

    let body = {};
    body.jsonrpc = "2.0";
    body.id = "1";
    // body.method = 'getnewaddress';
    // body.method = 'listtransactions';
    body.method = 'getaddressinfo';
    // body.method =  'getbalance';
    // body.method =  'getalladdress';
    body.params = ['T3Y2NXHU7NWG7YFKVAGL3US2JY5RQCD7'];


    opt.body = JSON.stringify(body);
    let ret  = await request(opt);
    ret = JSON.parse(ret);

    console.log(JSON.stringify(ret, null, 3));
    if (ret.result) {
        console.log('list transactions count:', ret.result.length);
    }
}

test();
*/
//curl --data '{"jsonrpc":"2.0", "id":1, "method":"getnewaddress", "params":{} }' http://127.0.0.1:8090
//curl --data '{"jsonrpc":"2.0", "id":1, "method":"sendtoaddress", "params":["R2CJ353CPFT6ZB372H324A5VYOGPVOKI", 5] }' http://127.0.0.1:8090
//curl --data '{"jsonrpc":"2.0", "id":1, "method":"getbalance", "params":{} }' http://127.0.0.1:6552



// no witnesses yet, will retry later
