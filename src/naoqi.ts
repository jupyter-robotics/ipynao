/*
**  Copyright (C) Aldebaran Robotics
**  See COPYING for the license
**
**  Author(s):
**   - Laurent LEC    <llec@aldebaran-robotics.com>
**
*/
// import { io } from './socket.io';

import { io } from "socket.io-client";

export function QiSession(
    this: any, connected: any, disconnected: any, host: any) 
{
    console.log("DBG Emile qim about to connect w/17");
    // let _socket = io(
        // "http://" + (host ? host : window.location.host), 
        // { resource: "libs/qimessaging/2/socket.io", 'force new connection': true }
    // );

    // TODO: get robot IP
    let _socket = io("nao@nao.local:80");

    // @ts-ignore
    window["socks"] = _socket;
    console.log("CONNECTED?", _socket.connected);

    console.log("DBG Emile qim connecting..");

    let _dfd = new Array();
    let _sigs = new Array();
    let _idm = 0;

    _socket.on('reply', function (data) {
        console.log("DBG Emile qim reply");
        // let idm = data["idm"];
        // if (data["result"] != null && data["result"]["metaobject"] != undefined) {
        //     let obj = new Object();
        //     obj.__MetaObject = data["result"]["metaobject"];

        //     let pyobj = data["result"]["pyobject"];
        //     _sigs[pyobj] = new Array();
        //     let methods = obj.__MetaObject["methods"];

        //     for (let i in methods) {
        //         let methodName = methods[i]["name"];
        //         obj[methodName] = createMetaCall(pyobj, methodName, "data");
        //     }
        //     let signals = obj.__MetaObject["signals"];
        //     for (let i in signals) {
        //         let signalName = signals[i]["name"];
        //         obj[signalName] = createMetaSignal(pyobj, signalName, false);
        //     }
        //     let properties = obj.__MetaObject["properties"];
        //     for (let i in properties) {
        //         let propertyName = properties[i]["name"];
        //         obj[propertyName] = createMetaSignal(pyobj, propertyName, true);
        //     }
        //     _dfd[idm].resolve(obj);
        // }
        // else {
        //     if (_dfd[idm].__cbi != undefined) {
        //         let cbi = _dfd[idm].__cbi;
        //         _sigs[cbi["obj"]][cbi["signal"]][data["result"]] = cbi["cb"];
        //     }
        //     _dfd[idm].resolve(data["result"]);
        // }
        // delete _dfd[idm];
    });

    _socket.on('error', function (data) {
        console.log("DBG Emile qim error");
        if (data["idm"] != undefined) {
            _dfd[data["idm"]].reject(data["result"]);
            delete _dfd[data["idm"]];
        }
    });

    _socket.on('signal',  (data) => {
        console.log("DBG Emile qim signal");
        let res = data["result"];
        let callback = _sigs[res["obj"]][res["signal"]][res["link"]];
        if (callback != undefined) {
            callback.apply(this, res["data"]);
        }
    });

    _socket.on('disconnect', function (data) {
        console.log("DBG Emile qim disconnect");
        for (let idm in _dfd) {
            _dfd[idm].reject("Call " + idm + " canceled: disconnected");
            delete _dfd[idm];
        }
        if (disconnected) {
            disconnected();
        }
    });

    function createMetaCall(obj: any, member: any, data: any) {
        return function () {
            let idm = ++_idm;
            let args = Array.prototype.slice.call(arguments, 0);
            let promise = new Promise(function (resolve, reject) {
                _dfd[idm] = { resolve: resolve, reject: reject };
            });
            if (args[0] == "connect") {
                _dfd[idm].__cbi = data;
            }
            _socket.emit('call', { idm: idm, params: { obj: obj, member: member, args: args } });
            return promise;
        };
    }

    // NOTE: NOT USED
    // function createMetaSignal(obj: any, signal: any, isProperty: any) {
    //     let signalObj = new Object();
        // _sigs[obj][signal] = new Array();
        // signalObj.connect = function (cb) {
        //     return createMetaCall(obj, signal, { obj: obj, signal: signal, cb: cb })("connect");
        // };
        // signalObj.disconnect = function (l) {
        //     delete _sigs[obj][signal][l];
        //     return createMetaCall(obj, signal)("disconnect", l);
        // };
        // if (!isProperty) {
        //     return signalObj;
        // }
        // signalObj.setValue = function () {
        //     let args = Array.prototype.slice.call(arguments, 0);
        //     return createMetaCall(obj, signal).apply(this, ["setValue"].concat(args));
        // };
        // signalObj.value = function () {
        //     return createMetaCall(obj, signal)("value");
        // };
        // return signalObj;
    // }

    this.service = createMetaCall("ServiceDirectory", "service", "data");

    let _self = this;

    _socket.on('connect', function () {
        console.log("DBG Emile qim connect");
        if (connected) {
            connected(_self);
        }
    });
    console.log("DBG Emile qim done with init");
}
