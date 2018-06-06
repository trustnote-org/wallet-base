'use strict'

var sqlitePool = require('./sqlite_pool.js');
var path = '../offline/initial.trustnote-light.sqlite'
const constants = require('../config/constants');
var saveJointHelper = require('./save_joint_helper');


class DataBase {

    constructor() {
        this.db = sqlitePool(path,1, false, this.errorHandler);
    }

    errorHandler(err) {
        console.log('catch error: ',err);
    }

    query (){
        this.db.query.apply(null,arguments);
    }

    insertWitnesses (arrWitnesses) {
        return new Promise((resolve, reject) => {
            if (arrWitnesses.length !== constants.COUNT_WITNESSES){
                throw Error("attempting to insert wrong number of witnesses: "+arrWitnesses.length);
            }
            var placeholders = Array.apply(null, Array(arrWitnesses.length)).map(function(){ return '(?)'; }).join(',');
            this.query("INSERT INTO my_witnesses (address) VALUES "+placeholders, arrWitnesses, function(){
                console.log('inserted witnesses');
                resolve();
            });
        });
    }

    readMyWitnesses () {
        return new Promise((resolve, reject) => {
            this.query("SELECT address FROM my_witnesses ORDER BY address", function(rows){
                var arrWitnesses = rows.map(function(row){ return row.address; });
                resolve(arrWitnesses);
            })
        });
    }

    insertMyAddresses (wallet, is_change, address_index, address, arrDefinition){
        return new Promise((resolve, reject) => {
            let db = this.db;
            if (typeof address_index === 'string' && is_change)
                throw Error("address with string index cannot be change address");
            var address_index_column_name = (typeof address_index === 'string') ? 'app' : 'address_index';
            this.query( // IGNORE in case the address was already generated
                "INSERT "+db.getIgnore()+" INTO my_addresses (wallet, is_change, "+address_index_column_name+", address, definition) VALUES (?,?,?,?,?)",
                [wallet, is_change, address_index, address, JSON.stringify(arrDefinition)],
                function(){
                    resolve();
                }
            );
        });
    }

    readMyAddresses () {
        return new Promise((resolve, reject) => {
            this.query("SELECT address FROM my_addresses UNION SELECT shared_address AS address FROM shared_addresses", function(rows){
                var arrAddresses = rows.map(function(row){ return row.address; });
                resolve(arrAddresses);
            })
        });
    }

    readListOfUnstableUnits(){
        return new Promise((resolve, reject) => {
            this.query("SELECT unit FROM units WHERE is_stable=0", function(rows){
                var arrUnits = rows.map(function(row){ return row.unit; });
                resolve(arrUnits);
            })
        })
    }

    readKnownStableUnits (arrAddresses) {
        return new Promise ((resolve, reject) => {
            var strAddressList = arrAddresses.map(this.db.escape).join(', ');
            this.query(
                "SELECT unit FROM unit_authors JOIN units USING(unit) WHERE is_stable=1 AND address IN("+strAddressList+") \n\
                UNION \n\
                SELECT unit FROM outputs JOIN units USING(unit) WHERE is_stable=1 AND address IN("+strAddressList+")",
                function(rows){
                    let known_stable_units = rows.map(function(row){ return row.unit; });
                    resolve(known_stable_units);
                }
            );
        })
    }

    __saveJoint (joint) {
        let sequence = 'good';
        let objValidationState = { 
             sequence: sequence, 
             arrDoubleSpendInputs: [], 
             arrAdditionalQueries: []
        };
        return new Promise((resolve, reject )=>{
            saveJointHelper(this.db, joint, objValidationState , null, function(err, objUnit, objJoint){
                if(err)  errorHandler(err);
                // console.log('err: ',err, '\nobjUnit', JSON.stringify(objUnit, null, 3));
                resolve();
            });
        })
    }

    async saveLightHistory(lightHistoryResponse) {
        var arrProvenUnits = [];// is stable units 
        for (let joint of lightHistoryResponse.joints) {
            await this.__saveJoint(joint);
        }
        for ( let ball of lightHistoryResponse.proofchain_balls) {
            arrProvenUnits.push(ball.unit);
        }
        return new Promise((resolve,reject) => {
            this.query("UPDATE units SET is_stable=1, is_free=0 WHERE unit IN(?)", [arrProvenUnits], function(){ 
                console.log('update units is_stable successfully');
                resolve();
            });
        })
    }
}

module.exports = DataBase;
