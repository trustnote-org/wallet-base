'use strict'

var WebSocket = require('ws');
var WebSocketServer = WebSocket.Server;
var crypto = require('crypto');
var _ = require('lodash');
var objectHash = require('./crypto/object_hash');
var RESPONSE_TIMEOUT = 300*1000; // after this timeout, the request is abandoned
var assocReroutedConnectionsByTag = {};
var wallet = require('./wallet');
var eventBus = require('./tools/event_bus');

class NetworkManager {

    constructor() {
        this.ws = null;
        this.challenge = null;
    }

    connectToHub (url, onOpen) {
        return new Promise(async (resolve, reject) => {
            var options = {};
            let _this = this;
            this.ws = new WebSocket(url);
            let ws = this.ws;
            ws.peer = url;
            ws.setMaxListeners(20); //avoid warning
            ws.once('open', function onWsOpen() {
                _this.ws.assocPendingRequests = {};
                console.log('connected to ' + url );
                console.log('connectToHub done');
                resolve();
            });
            ws.on('close', function onWsClose() {
                console.log('close event, removing '+ url);
            });
            ws.on('error', function onWsError(e){
                console.log("error from server "+url+": "+e);
            });
            ws.on('message', this.onWebsocketMessage.bind(this));
        });
    }

    onWebsocketMessage(message) {
        let ws = this.ws;
        if (ws.readyState !== ws.OPEN)
            return;
    
        console.log('\nRECEIVED '+(message.length > 1000 ? message.substr(0,1000)+'...' : message)+' from '+ws.peer);
        ws.last_ts = Date.now();
        
        try{
            var arrMessage = JSON.parse(message);
        }
        catch(e){
            return console.log('failed to json.parse message '+message);
        }
        // console.log(JSON.stringify(arrMessage, null, 3));
        var message_type = arrMessage[0];
        var content = arrMessage[1];
        
        switch (message_type){
            case 'justsaying':
                return this.handleJustsaying(content.subject, content.body);
                
            // case 'request':
            //     return handleRequest(ws, content.tag, content.command, content.params);
                
            case 'response':
                return this.handleResponse(content.tag, content.response);
                
            default: 
                console.log("unknown type: "+message_type);
        }
    }

    handleJustsaying (subject, body){
        let ws = this.ws;
        switch (subject){
            case 'refresh':
                return;            
            case 'version':

                break;

            case 'new_version': // a new version is available
                break;

            case 'hub/push_project_number':

                break;
            
            case 'bugreport':

                break;
                
            case 'joint':

                return;
            case 'free_joints_end':
            case 'result':
            case 'info':
            case 'error':
                break;
                
            case 'private_payment':
                break;
                
            case 'my_url':
                break;
                
            case 'want_echo':
                break;
                
            case 'your_echo': // comes on the same ws as my_url, claimed_url is already set
                break;
                
            // I'm a hub, the peer wants to authenticate
            case 'hub/login':
                break;
                
            // I'm a hub, the peer wants to download new messages
            case 'hub/refresh':
                break;
                
            // I'm a hub, the peer wants to remove a message that he's just handled
            case 'hub/delete':
                break;
                
            // I'm connected to a hub
            case 'hub/challenge':
            case 'hub/message':
            case 'hub/message_box_status':
                if (!body) {
                    return;
                }
                this.challenge = body;
                // eventBus.emit("message_from_hub", ws, subject, body);
                break;
                
            // I'm light client
            case 'light/have_updates':
                break;
                
            // I'm light vendor
            case 'light/new_address_to_watch':
                break;
        }
    }


    handleResponse(tag, response){
        let ws = this.ws;
        var pendingRequest = ws.assocPendingRequests[tag];
        if (!pendingRequest) // was canceled due to timeout or rerouted and answered by another peer
            //throw "no req by tag "+tag;
            return console.log("no req by tag "+tag);
        pendingRequest.responseHandlers.forEach(function(responseHandler){
            process.nextTick(function(){
                responseHandler(ws, pendingRequest.request, response);
            });
        });
        
        clearTimeout(pendingRequest.reroute_timer);
        clearTimeout(pendingRequest.cancel_timer);
        delete ws.assocPendingRequests[tag];
        
        // if the request was rerouted, cancel all other pending requests
        if (assocReroutedConnectionsByTag[tag]){
            assocReroutedConnectionsByTag[tag].forEach(function(client){
                if (client.assocPendingRequests[tag]){
                    clearTimeout(client.assocPendingRequests[tag].reroute_timer);
                    clearTimeout(client.assocPendingRequests[tag].cancel_timer);
                    delete client.assocPendingRequests[tag];
                }
            });
            delete assocReroutedConnectionsByTag[tag];
        }
    }

    sendMessage(type, content) {
        let ws = this.ws;
        var message = JSON.stringify([type, content]);
        if (ws.readyState !== ws.OPEN)
            return console.log("readyState="+ws.readyState+' on peer '+ws.peer+', will not send '+message);
        console.log("\nSENDING "+message+" to "+ws.peer);
        ws.send(message);
    }

    sendJustsaying(subject, body){
        this.sendMessage('justsaying', {subject: subject, body: body});
    }


    sendVersion(version){
        this.sendJustsaying('version', version);
    }


    // if a 2nd identical request is issued before we receive a response to the 1st request, then:
    // 1. its responseHandler will be called too but no second request will be sent to the wire
    // 2. bReroutable flag must be the same
    _sendRequest(command, params, bReroutable, responseHandler){
        let ws = this.ws;
        var request = {command: command};
        if (params)
            request.params = params;
        var content = _.clone(request);
        var tag = objectHash.getBase64Hash(request);
        //if (ws.assocPendingRequests[tag]) // ignore duplicate requests while still waiting for response from the same peer
        //    return console.log("will not send identical "+command+" request");
        if (ws.assocPendingRequests[tag]){
            console.log('already sent a '+command+' request to '+ws.peer+', will add one more response handler rather than sending a duplicate request to the wire');
            ws.assocPendingRequests[tag].responseHandlers.push(responseHandler);
        }
        else{
            content.tag = tag;
            var cancel_timer = bReroutable ? null : setTimeout(function(){
                ws.assocPendingRequests[tag].responseHandlers.forEach(function(rh){
                    rh(ws, request, {error: "[internal] response timeout"});
                });
                delete ws.assocPendingRequests[tag];
            }, RESPONSE_TIMEOUT);
            ws.assocPendingRequests[tag] = {
                request: request,
                responseHandlers: [responseHandler],
                cancel_timer: cancel_timer
            };
            this.sendMessage('request', content);
        }
    }
    sendRequest (command, params, bReroutable) {
        let _this = this;
        let resolve;
        const promise = new Promise(r => resolve = r);
        _this._sendRequest(command,params,bReroutable, function(ws, request, response){
              resolve({ws:ws, request:request, response: response});
        });
        return promise;
    }

    fetchChallenge() {
        if (this.challenge) {
            return this.challenge;
        }
        console.log('now, we have not receive hub/challenge from a hub, challenge is null');
        return null;
    }

}

module.exports = NetworkManager;
/*
*/