/*jslint node: true */
"use strict";
var headlessWallet = require('../start.js');
var eventBus = require('trustnote-common/event_bus.js');

function onError(err){
	throw Error(err);
}

function createProfile(){
	var composer = require('trustnote-common/composer.js');
	var network = require('trustnote-common/network.js');
	var callbacks = composer.getSavingCallbacks({
		ifNotEnoughFunds: onError,
		ifError: onError,
		ifOk: function(objJoint){
			network.broadcastJoint(objJoint);
		}
	});

	var profile = {
		age: 24,
		name: "George",
		emails: ["george@example.com", "george@anotherexample.com"]
	};
	composer.composeProfileJoint("PYQJWUWRMUUUSUHKNJWFHSR5OADZMUYR", profile, headlessWallet.signer, callbacks);
}

eventBus.on('headless_wallet_ready', createProfile);
