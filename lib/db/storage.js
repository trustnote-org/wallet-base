/*jslint node: true */
"use strict";

const constants = {};
constants.GENESIS_UNIT = 'rg1RzwKwnfRHjBojGol3gZaC5w7kR++rOR6O61JRsrQ=';

function isGenesisUnit(unit){
    return (unit === constants.GENESIS_UNIT);
}

exports.isGenesisUnit = isGenesisUnit;
