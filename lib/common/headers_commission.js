/*jslint node: true */
"use strict";
var crypto = require('crypto');
var async = require('async');


function getMaxSpendableMciForLastBallMci(last_ball_mci){
    return last_ball_mci - 1;
}

exports.getMaxSpendableMciForLastBallMci = getMaxSpendableMciForLastBallMci;
