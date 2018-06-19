/*jslint node: true */
"use strict";

const constants = {};
constants.GENESIS_UNIT = 'rg1RzwKwnfRHjBojGol3gZaC5w7kR++rOR6O61JRsrQ=';

function isGenesisUnit(unit){
    return (unit === constants.GENESIS_UNIT);
}


function determineIfWitnessAddressDefinitionsHaveReferences(conn, arrWitnesses, handleResult){
    conn.query(
        "SELECT 1 FROM address_definition_changes JOIN definitions USING(definition_chash) \n\
        WHERE address IN(?) AND has_references=1 \n\
        UNION \n\
        SELECT 1 FROM definitions WHERE definition_chash IN(?) AND has_references=1 \n\
        LIMIT 1",
        [arrWitnesses, arrWitnesses],
        function(rows){
            handleResult(rows.length > 0);
        }
    );
}

function findWitnessListUnit(conn, arrWitnesses, last_ball_mci, handleWitnessListUnit){
    conn.query(
        "SELECT witness_list_hashes.witness_list_unit \n\
        FROM witness_list_hashes CROSS JOIN units ON witness_list_hashes.witness_list_unit=unit \n\
        WHERE witness_list_hash=? AND sequence='good' AND is_stable=1 AND main_chain_index<=?", 
        [objectHash.getBase64Hash(arrWitnesses), last_ball_mci], 
        function(rows){
            handleWitnessListUnit((rows.length === 0) ? null : rows[0].witness_list_unit);
        }
    );
}




exports.findWitnessListUnit = findWitnessListUnit;
exports.determineIfWitnessAddressDefinitionsHaveReferences = determineIfWitnessAddressDefinitionsHaveReferences;
exports.isGenesisUnit = isGenesisUnit;
