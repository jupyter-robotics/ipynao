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
  connected: any;
  disconnected: any;
  host: any;
  service: any;
  _dfd: Array<any>;
  _sigs: Array<any>;
  _idm: number;
  _socket: any;

  constructor(
    ipAddress: string = 'nao.local',
    port: string = '80',
    connected?: any,
    disconnected?: any
  ) {
    this.connected = connected;
    this.disconnected = disconnected;
    console.log('DBG Emile qim about to connect w/17');
    this._socket = io.connect('nao:nao@' + ipAddress + ':' + port, {
      resource: 'libs/qimessaging/2/socket.io',
      'force new connection': true,
    });
    console.log('DBG Emile qim connecting..');
    let _dfd = (this._dfd = new Array());
    let _sigs = (this._sigs = new Array());
    this._idm = 0;

    interface replyType {
      __MetaObject?: any;
      [key: string]: any;
    }

    this._socket.on('reply', (data: any) => {
      console.log('DBG Emile qim reply');

      let idm = data['idm'];
      if (data['result'] != null && data['result']['metaobject'] != undefined) {
        let replyObject: replyType = {
          __MetaObject: data['result']['metaobject'],
        };

        let pyobj = data['result']['pyobject'];
        _sigs[pyobj] = new Array();
        let methods = replyObject.__MetaObject['methods'];

        for (let i in methods) {
          let methodName = methods[i]['name'];
          replyObject[methodName] = this.createMetaCall(
            pyobj,
            methodName,
            'data'
          );
        }

        let signals = replyObject.__MetaObject['signals'];
        for (let i in signals) {
          let signalName = signals[i]['name'];
          replyObject[signalName] = this.createMetaSignal(
            pyobj,
            signalName,
            false
          );
        }

        let properties = replyObject.__MetaObject['properties'];
        for (let i in properties) {
          let propertyName = properties[i]['name'];
          replyObject[propertyName] = this.createMetaSignal(
            pyobj,
            propertyName,
            true
          );
        }

        _dfd[idm].resolve(replyObject);
      } else {
        if (_dfd[idm].__cbi != undefined) {
          let cbi = _dfd[idm].__cbi;
          _sigs[cbi['obj']][cbi['signal']][data['result']] = cbi['cb'];
        }
        _dfd[idm].resolve(data['result']);
      }
      delete _dfd[idm];
    });

    this._socket.on('error', function (data: any) {
      console.log('DBG Emile qim error');
      if (data['idm'] != undefined) {
        _dfd[data['idm']].reject(data['result']);
        delete _dfd[data['idm']];
      }
    });

    this._socket.on('signal', (data: any) => {
      console.log('DBG Emile qim signal');
      let res = data['result'];
      let callback = _sigs[res['obj']][res['signal']][res['link']];
      if (callback != undefined) {
        callback.apply(this, res['data']);
      }
    });

    this._socket.on('disconnect', (data: any) => {
      console.log('DBG Emile qim disconnect');
      for (let idm in _dfd) {
        _dfd[idm].reject('Call ' + idm + ' canceled: disconnected');
        delete _dfd[idm];
      }

      if (this.disconnected) {
        this.disconnected();
        console.log('DBG Isabel disconnected');
      }
    });

    this.service = this.createMetaCall('ServiceDirectory', 'service', 'data');

    this._socket.on('connect', () => {
      console.log('DBG Emile qim connect');
      if (this.connected) {
        this.connected(this);
      }
    });
    console.log('DBG Emile qim done with init');
  }

  createMetaCall(obj: any, member: any, data: any) {
    return (...serviceArgs: any[]) => {
      let idm = ++this._idm;
      let args = Array.prototype.slice.call(serviceArgs, 0);
      let promise = new Promise((resolve, reject) => {
        this._dfd[idm] = { resolve: resolve, reject: reject };
      });
      if (args[0] == 'connect') {
        this._dfd[idm].__cbi = data;
      }
      this._socket.emit('call', {
        idm: idm,
        params: { obj: obj, member: member, args: args },
      });
      return promise;
    };
  }

  createMetaSignal(obj: any, signal: any, isProperty: any) {
    let signalObject: any = {};
    this._sigs[obj][signal] = new Array();
    signalObject.connect = (cb: any) => {
      return this.createMetaCall(obj, signal, {
        obj: obj,
        signal: signal,
        cb: cb,
      })('connect');
    };

    signalObject.disconnect = (args: any) => {
      delete this._sigs[obj][signal][args];
      return this.createMetaCall(obj, signal, 'data')('disconnect', args);
    };

    if (!isProperty) {
      return signalObject;
    }

    signalObject.setValue = () => {
      let args = Array.prototype.slice.call(arguments, 0);
      return this.createMetaCall(obj, signal, 'data').apply(
        this,
        ['setValue'].concat(args)
      );
    };

    signalObject.value = () => {
      return this.createMetaCall(obj, signal, 'data')('value');
    };

    return signalObject;
  }
}
