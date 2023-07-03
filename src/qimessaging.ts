/*
 **  Copyright (C) Aldebaran Robotics
 **  See COPYING for the license
 **
 **  Author(s):
 **   - Laurent LEC    <llec@aldebaran-robotics.com>
 **
 */
import io from 'nao-socket.io';

interface replyType {
  __MetaObject?: any;
  [key: string]: any;
}

interface signalType {
  connect?: any;
  disconnect?: any;
  setValue?: any;
  value?: any;
}

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
    ipAddress = 'nao.local',
    port = '80',
    connected?: 'function',
    disconnected?: 'function'
  ) {
    this.connected = connected;
    this.disconnected = disconnected;

    this._socket = io.connect('nao:nao@' + ipAddress + ':' + port, {
      resource: 'libs/qimessaging/2/socket.io',
      'force new connection': true,
    });

    this._dfd = [];
    this._sigs = [];
    this._idm = 0;

    this._socket.on('reply', (data: any) => {
      this.onReply(data);
    });

    this._socket.on('error', (data: any) => {
      this.onError(data);
    });

    this._socket.on('signal', (data: any) => {
      this.onSignal(data);
    });

    this._socket.on('disconnect', this.onDisconnect);

    this._socket.on('connect', this.onConnect);

    this.service = this.createMetaCall('ServiceDirectory', 'service', 'data');
  }

  isConnected() {
    const connected: boolean =
      this._socket !== undefined ? this._socket.socket.connected : false;
    return connected;
  }

  disconnect() {
    this._socket.disconnect();
  }

  onReply(data: any) {
    const idm = data['idm'];
    if (
      data['result'] !== undefined &&
      data['result']['metaobject'] !== undefined
    ) {
      const replyObject: replyType = {
        __MetaObject: data['result']['metaobject'],
      };

      const pyIndex = data['result']['pyobject'];
      this._sigs[pyIndex] = [];
      const methods = replyObject.__MetaObject['methods'];

      for (const i in methods) {
        const methodName = methods[i]['name'];
        replyObject[methodName] = this.createMetaCall(
          pyIndex,
          methodName,
          'data'
        );
      }

      const signals = replyObject.__MetaObject['signals'];
      for (const i in signals) {
        const signalName = signals[i]['name'];
        replyObject[signalName] = this.createMetaSignal(
          pyIndex,
          signalName,
          false
        );
      }

      const properties = replyObject.__MetaObject['properties'];
      for (const i in properties) {
        const propertyName = properties[i]['name'];
        replyObject[propertyName] = this.createMetaSignal(
          pyIndex,
          propertyName,
          true
        );
      }

      this._dfd[idm].resolve(replyObject);
    } else {
      if (this._dfd[idm].__cbi !== undefined) {
        const cbi = this._dfd[idm].__cbi;
        this._sigs[cbi['obj']][cbi['signal']][data['result']] = cbi['cb'];
      }
      this._dfd[idm].resolve(data['result']);
    }
    delete this._dfd[idm];
  }

  onError(data: any) {
    if (data['idm'] !== undefined) {
      this._dfd[data['idm']].reject(data['result']);
      delete this._dfd[data['idm']];
    }
  }

  onSignal(data: any) {
    const result = data['result'];
    const callback =
      this._sigs[result['obj']][result['signal']][result['link']];
    if (callback !== undefined) {
      callback.apply(this, result['data']);
    }
  }

  onConnect() {
    if (this.connected) {
      this.connected(this);
    }
  }

  onDisconnect(_data: any) {
    for (const idm in this._dfd) {
      this._dfd[idm].reject('Call ' + idm + ' canceled: disconnected');
      delete this._dfd[idm];
    }

    if (this.disconnected) {
      this.disconnected();
    }
  }

  createMetaCall(obj: any, member: any, data: any) {
    return (...serviceArgs: any[]) => {
      ++this._idm;

      const promise = new Promise((resolve, reject) => {
        this._dfd[this._idm] = { resolve: resolve, reject: reject };
      });
      if (serviceArgs[0] === 'connect') {
        this.isConnected = this._socket.socket.connected;
        this._dfd[this._idm].__cbi = data;
      }
      this._socket.emit('call', {
        idm: this._idm,
        params: { obj: obj, member: member, args: serviceArgs },
      });
      return promise;
    };
  }

  createMetaSignal(obj: any, signal: any, isProperty: boolean) {
    const signalObject: signalType = {};
    this._sigs[obj][signal] = [];
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

    signalObject.setValue = (...valueArgs: any[]) => {
      return this.createMetaCall(obj, signal, 'data').apply(
        this,
        ['setValue'].concat(valueArgs)
      );
    };

    signalObject.value = () => {
      return this.createMetaCall(obj, signal, 'data')('value');
    };

    return signalObject;
  }
}
