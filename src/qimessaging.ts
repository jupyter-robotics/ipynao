/*
 **  Copyright (C) Aldebaran Robotics
 **  See COPYING for the license
 **
 **  Author(s):
 **   - Laurent LEC    <llec@aldebaran-robotics.com>
 **
 */
import io from 'nao-socket.io';

export class QiSession {
  connected: Boolean = false;
  disconnected: any;
  host: any;
  service: any;

  constructor(ipAddress: string = 'nao.local', port: string = '80') {
    console.log('DBG Emile qim about to connect w/17');
    let _socket = io.connect('nao:nao@' + ipAddress + ':' + port, {
      resource: 'libs/qimessaging/2/socket.io',
      'force new connection': true,
    });
    console.log('DBG Emile qim connecting..');
    let _dfd = new Array();
    let _sigs = new Array();
    let _idm = 0;

    interface replyType {
      __MetaObject?: any;
    }


    _socket.on('reply', function (data: any) {
      console.log('DBG Emile qim reply');
      // @ts-ignore
      window['datata'] = data;
      console.log("here's the datata", data); // REMOVE

      let idm = data['idm'];
      if (data['result'] != null && data['result']['metaobject'] != undefined) {
        // let o = new Object();
        let replyObject: replyType = {
          __MetaObject: data['result']['metaobject'],
        };

        let pyobj = data['result']['pyobject'];
        _sigs[pyobj] = new Array();
        let methods = replyObject.__MetaObject['methods'];

        for (let i in methods) {
          let methodName = methods[i]['name'];
          // @ts-ignore
          replyObject[methodName] = createMetaCall(pyobj, methodName, 'data');
        }
        let signals = replyObject.__MetaObject['signals'];
        for (let i in signals) {
          let signalName = signals[i]['name'];
          // @ts-ignore
          replyObject[signalName] = createMetaSignal(pyobj, signalName, false);
        }
        let properties = replyObject.__MetaObject['properties'];
        for (let i in properties) {
          let propertyName = properties[i]['name'];
          // @ts-ignore
          replyObject[propertyName] = createMetaSignal(pyobj, propertyName, true);
        }
        _dfd[idm].resolve(replyObject);

        console.log('What is this o'); // REMOVE
        // @ts-ignore
        window['ooo'] = replyObject; // REMOVE
        // @ts-ignore
        window['dfd'] = _dfd; // REMOVE
      } else {
        if (_dfd[idm].__cbi != undefined) {
          let cbi = _dfd[idm].__cbi;
          _sigs[cbi['obj']][cbi['signal']][data['result']] = cbi['cb'];
        }
        _dfd[idm].resolve(data['result']);
      }
      delete _dfd[idm];
    });

    _socket.on('error', function (data: any) {
      console.log('DBG Emile qim error');
      if (data['idm'] != undefined) {
        _dfd[data['idm']].reject(data['result']);
        delete _dfd[data['idm']];
      }
    });

    _socket.on('signal', function (data: any) {
      console.log("DBG Emile qim signal");
      let res = data['result'];
      let callback = _sigs[res['obj']][res['signal']][res['link']];
      if (callback != undefined) {
        // @ts-ignore
        callback.apply(this, res['data']);
      }
    });

    _socket.on('disconnect', function (data: any) {
      console.log("DBG Emile qim disconnect");
      for (let idm in _dfd) {
        _dfd[idm].reject('Call ' + idm + ' canceled: disconnected');
        delete _dfd[idm];
      }
      // @ts-ignore
      if (this.disconnected) {
        // disconnected();
        console.log('DBG Isabel disconnected');
      }
    });

    function createMetaCall(obj: any, member: any, data: any) {
      return function () {
        let idm = ++_idm;
        let args = Array.prototype.slice.call(arguments, 0);
        let promise = new Promise(function (resolve, reject) {
          _dfd[idm] = { resolve: resolve, reject: reject };
        });
        if (args[0] == 'connect') {
          _dfd[idm].__cbi = data;
        }
        _socket.emit('call', {
          idm: idm,
          params: { obj: obj, member: member, args: args },
        });
        return promise;
      };
    }

    interface signalType {
      connect?: any;
      disconnect?: any;
      setValue?: any;
      value?: any;
    }

    function createMetaSignal(obj: any, signal: any, isProperty: any) {
      let signalObject: signalType = {};
      _sigs[obj][signal] = new Array();
      signalObject.connect = function (cb: any) {
        return createMetaCall(obj, signal, {
          obj: obj,
          signal: signal,
          cb: cb,
        // @ts-ignore
        })('connect');
      };

      // @ts-ignore
      signalObject.disconnect = function (l) {
        delete _sigs[obj][signal][l];
        // @ts-ignore
        return createMetaCall(obj, signal, 'data')('disconnect', l);
      };
      if (!isProperty) {
        return signalObject;
      }
      signalObject.setValue = function () {
        let args = Array.prototype.slice.call(arguments, 0);
        return createMetaCall(obj, signal, 'data').apply(
          this,
          // @ts-ignore
          ['setValue'].concat(args)
        );
      };
      signalObject.value = function () {
        // @ts-ignore
        return createMetaCall(obj, signal, 'data')('value');
      };
      return signalObject;
    }

    this.service = createMetaCall('ServiceDirectory', 'service', 'data');
    // let _self = this;
    _socket.on('connect', function () {
      console.log("DBG Emile qim connect");
      // @ts-ignore
      if (this.connected) {
        // connected(_self);
        console.log('DBG Isabel already connected');
      }
    });
    console.log("DBG Emile qim done with init");
  }
}
