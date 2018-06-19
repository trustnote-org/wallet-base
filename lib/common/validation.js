/*jslint node: true */
"use strict";
var async = require('async');


function validate(objJoint, callbacks) {
    
    var objUnit = objJoint.unit;
    if (typeof objUnit !== "object" || objUnit === null)
        throw Error("no unit object");
    if (!objUnit.unit)
        throw Error("no unit");
    
    console.log("\nvalidating joint identified by unit "+objJoint.unit.unit);
    
    if (!isStringOfLength(objUnit.unit, constants.HASH_LENGTH))
        return callbacks.ifJointError("wrong unit length");
    
    try{
        // UnitError is linked to objUnit.unit, so we need to ensure objUnit.unit is true before we throw any UnitErrors
        if (objectHash.getUnitHash(objUnit) !== objUnit.unit)
            return callbacks.ifJointError("wrong unit hash: "+objectHash.getUnitHash(objUnit)+" != "+objUnit.unit);
    }
    catch(e){
        return callbacks.ifJointError("failed to calc unit hash: "+e);
    }
    
    if (objJoint.unsigned){
        if (hasFieldsExcept(objJoint, ["unit", "unsigned"]))
            return callbacks.ifJointError("unknown fields in unsigned unit-joint");
    }
    else if ("ball" in objJoint){
        if (!isStringOfLength(objJoint.ball, constants.HASH_LENGTH))
            return callbacks.ifJointError("wrong ball length");
        if (hasFieldsExcept(objJoint, ["unit", "ball", "skiplist_units"]))
            return callbacks.ifJointError("unknown fields in ball-joint");
        if ("skiplist_units" in objJoint){
            if (!isNonemptyArray(objJoint.skiplist_units))
                return callbacks.ifJointError("missing or empty skiplist array");
            //if (objUnit.unit.charAt(0) !== "0")
            //    return callbacks.ifJointError("found skiplist while unit doesn't start with 0");
        }
    }
    else{
        if (hasFieldsExcept(objJoint, ["unit"]))
            return callbacks.ifJointError("unknown fields in unit-joint");
    }
    
    if ("content_hash" in objUnit){ // nonserial and stripped off content
        if (!isStringOfLength(objUnit.content_hash, constants.HASH_LENGTH))
            return callbacks.ifUnitError("wrong content_hash length");
        if (hasFieldsExcept(objUnit, ["unit", "version", "alt", "timestamp", "authors", "witness_list_unit", "witnesses", "content_hash", "parent_units", "last_ball", "last_ball_unit"]))
            return callbacks.ifUnitError("unknown fields in nonserial unit");
        if (!objJoint.ball)
            return callbacks.ifJointError("content_hash allowed only in finished ball");
    }
    else{ // serial
        if (hasFieldsExcept(objUnit, ["unit", "version", "alt", "timestamp", "authors", "messages", "witness_list_unit", "witnesses", "earned_headers_commission_recipients", "last_ball", "last_ball_unit", "parent_units", "headers_commission", "payload_commission"]))
            return callbacks.ifUnitError("unknown fields in unit");

        if (typeof objUnit.headers_commission !== "number")
            return callbacks.ifJointError("no headers_commission");
        if (typeof objUnit.payload_commission !== "number")
            return callbacks.ifJointError("no payload_commission");
        
        if (!isNonemptyArray(objUnit.messages))
            return callbacks.ifUnitError("missing or empty messages array");
        if (objUnit.messages.length > constants.MAX_MESSAGES_PER_UNIT)
            return callbacks.ifUnitError("too many messages");

        if (objectLength.getHeadersSize(objUnit) !== objUnit.headers_commission)
            return callbacks.ifJointError("wrong headers commission, expected "+objectLength.getHeadersSize(objUnit));
        if (objectLength.getTotalPayloadSize(objUnit) !== objUnit.payload_commission)
            return callbacks.ifJointError("wrong payload commission, unit "+objUnit.unit+", calculated "+objectLength.getTotalPayloadSize(objUnit)+", expected "+objUnit.payload_commission);
    }
    
    if (!isNonemptyArray(objUnit.authors))
        return callbacks.ifUnitError("missing or empty authors array");
    

    if (objUnit.version !== constants.version)
        return callbacks.ifUnitError("wrong version");
    if (objUnit.alt !== constants.alt)
        return callbacks.ifUnitError("wrong alt");

    
    if (!storage.isGenesisUnit(objUnit.unit)){
        if (!isNonemptyArray(objUnit.parent_units))
            return callbacks.ifUnitError("missing or empty parent units array");
        
        if (!isStringOfLength(objUnit.last_ball, constants.HASH_LENGTH))
            return callbacks.ifUnitError("wrong length of last ball");
        if (!isStringOfLength(objUnit.last_ball_unit, constants.HASH_LENGTH))
            return callbacks.ifUnitError("wrong length of last ball unit");
    }
    
    
    if ("witness_list_unit" in objUnit && "witnesses" in objUnit)
        return callbacks.ifUnitError("ambiguous witnesses");
        
    var arrAuthorAddresses = objUnit.authors ? objUnit.authors.map(function(author) { return author.address; } ) : [];
    
    var objValidationState = {
        arrAdditionalQueries: [],
        arrDoubleSpendInputs: [],
        arrInputKeys: []
    };
    if (objJoint.unsigned)
        objValidationState.bUnsigned = true;
    
    if (conf.bLight){
        if (!isPositiveInteger(objUnit.timestamp) && !objJoint.unsigned)
            return callbacks.ifJointError("bad timestamp");
        if (objJoint.ball)
            return callbacks.ifJointError("I'm light, can't accept stable unit "+objUnit.unit+" without proof");
        return objJoint.unsigned 
            ? callbacks.ifOkUnsigned(true) 
            : callbacks.ifOk({sequence: 'good', arrDoubleSpendInputs: [], arrAdditionalQueries: []}, function(){});
    }
    else{
        if ("timestamp" in objUnit && !isPositiveInteger(objUnit.timestamp))
            return callbacks.ifJointError("bad timestamp");
    }
    
    mutex.lock(arrAuthorAddresses, function(unlock){
        
        var conn = null;

        async.series(
            [
                function(cb){
                    db.takeConnectionFromPool(function(new_conn){
                        conn = new_conn;
                        conn.query("BEGIN", function(){cb();});
                    });
                },
                function(cb){
                    profiler.start();
                    checkDuplicate(conn, objUnit.unit, cb);
                },
                function(cb){
                    profiler.stop('validation-checkDuplicate');
                    profiler.start();
                    objUnit.content_hash ? cb() : validateHeadersCommissionRecipients(objUnit, cb);
                },
                function(cb){
                    profiler.stop('validation-hc-recipients');
                    profiler.start();
                    !objUnit.parent_units
                        ? cb()
                        : validateHashTree(conn, objJoint, objValidationState, cb);
                },
                function(cb){
                    profiler.stop('validation-hash-tree');
                    profiler.start();
                    !objUnit.parent_units
                        ? cb()
                        : validateParents(conn, objJoint, objValidationState, cb);
                },
                function(cb){
                    profiler.stop('validation-parents');
                    profiler.start();
                    !objJoint.skiplist_units
                        ? cb()
                        : validateSkiplist(conn, objJoint.skiplist_units, cb);
                },
                function(cb){
                    profiler.stop('validation-skiplist');
                    validateWitnesses(conn, objUnit, objValidationState, cb);
                },
                function(cb){
                    profiler.start();
                    validateAuthors(conn, objUnit.authors, objUnit, objValidationState, cb);
                },
                function(cb){
                    profiler.stop('validation-authors');
                    profiler.start();
                    objUnit.content_hash ? cb() : validateMessages(conn, objUnit.messages, objUnit, objValidationState, cb);
                }
            ], 
            function(err){
                profiler.stop('validation-messages');
                if(err){
                    conn.query("ROLLBACK", function(){
                        conn.release();
                        unlock();
                        if (typeof err === "object"){
                            if (err.error_code === "unresolved_dependency")
                                callbacks.ifNeedParentUnits(err.arrMissingUnits);
                            else if (err.error_code === "need_hash_tree") // need to download hash tree to catch up
                                callbacks.ifNeedHashTree();
                            else if (err.error_code === "invalid_joint") // ball found in hash tree but with another unit
                                callbacks.ifJointError(err.message);
                            else if (err.error_code === "transient")
                                callbacks.ifTransientError(err.message);
                            else
                                throw Error("unknown error code");
                        }
                        else
                            callbacks.ifUnitError(err);
                    });
                }
                else{
                    profiler.start();
                    conn.query("COMMIT", function(){
                        conn.release();
                        profiler.stop('validation-commit');
                        if (objJoint.unsigned){
                            unlock();
                            callbacks.ifOkUnsigned(objValidationState.sequence === 'good');
                        }
                        else
                            callbacks.ifOk(objValidationState, unlock);
                    });
                }
            }
        ); // async.series
        
    });
    
}


exports.validate = validate;
