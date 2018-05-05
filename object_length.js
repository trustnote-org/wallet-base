"use strict";

var PARENT_UNITS_SIZE = 2 * 44;

function getLength(value) {
    if (value === null)
        return 0;
    switch (typeof value) {
        case "string":
            return value.length;
        case "number":
            return 8;
        //return value.toString().length;
        case "object":
            var len = 0;
            if (Array.isArray(value))
                value.forEach(function (element) {
                    len += getLength(element);
                });
            else
                for (var key in value) {
                    if (typeof value[key] === "undefined")
                        throw Error("undefined at " + key + " of " + JSON.stringify(value));
                    len += getLength(value[key]);
                }
            return len;
        case "boolean":
            return 1;
        default:
            throw Error("unknown type=" + (typeof value) + " of " + value);
    }
}

function getHeadersSize(objUnit) {
    try {
        if (typeof (objUnit) == "string")
            var objHeader = JSON.parse(objUnit);
        else if (typeof (objUnit) == "object")
            var objHeader = objUnit;
        else
            return 0;
        if (objUnit.content_hash)
            throw Error("trying to get headers size of stripped unit");
        delete objHeader.unit;
        delete objHeader.headers_commission;
        delete objHeader.payload_commission;
        delete objHeader.main_chain_index;
        delete objHeader.timestamp;
        delete objHeader.messages;
        delete objHeader.parent_units; // replaced with PARENT_UNITS_SIZE
        return getLength(objHeader) + PARENT_UNITS_SIZE;
    } catch (error) {
        return 0;
    }
}

function getTotalPayloadSize(objUnit) {
    try {
        if (typeof (objUnit) == "string")
            var objUnit = JSON.parse(objUnit);
        else if (typeof (objUnit) == "object")
            var objUnit = objUnit;
        else
            return 0;
        if (objUnit.content_hash)
            throw Error("trying to get payload size of stripped unit");
        return getLength(objUnit.messages);
    } catch (error) {
        return 0;
    }

}

exports.getHeadersSize = getHeadersSize;
exports.getTotalPayloadSize = getTotalPayloadSize;
