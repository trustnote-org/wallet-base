/*jslint node: true */
"use strict";
var _ = require('lodash');
var async = require('async');
var constants = require("../config/constants.js");

function getMaxSpendableMciForLastBallMci(last_ball_mci){
    return last_ball_mci - 1 - constants.COUNT_MC_BALLS_FOR_PAID_WITNESSING;
}


// exports.updatePaidWitnesses = updatePaidWitnesses;
// exports.calcWitnessEarnings = calcWitnessEarnings;
exports.getMaxSpendableMciForLastBallMci = getMaxSpendableMciForLastBallMci;
