// Copyright (c) Isabel Paredes
// Distributed under the terms of the Modified BSD License.

import {
  DOMWidgetModel,
  DOMWidgetView,
  ISerializers,
} from '@jupyter-widgets/base';

import { MODULE_NAME, MODULE_VERSION } from './version';

// Import the CSS
import '../css/widget.css';

import { QiSession } from './qimessaging';

interface serviceDict {
  [key: string]: {
    [key: string]: any;
  };
}

export class NaoRobotModel extends DOMWidgetModel {
  qiSession: QiSession;
  connected = 'Disconnected';
  status = 'Not busy';
  _services: serviceDict = {};

  defaults() {
    return {
      ...super.defaults(),
      _model_name: NaoRobotModel.model_name,
      _model_module: NaoRobotModel.model_module,
      _model_module_version: NaoRobotModel.model_module_version,
      _view_name: NaoRobotModel.view_name,
      _view_module: NaoRobotModel.view_module,
      _view_module_version: NaoRobotModel.view_module_version,
      connected: 'Disconnected',
      status: 'Not busy',
      counter: 0,
    };
  }

  initialize(attributes: any, options: any): void {
    super.initialize(attributes, options);
    this.on('msg:custom', this.onCommand);
  }

  private changeStatus(statusMessage: string) {
    this.status = statusMessage;
    this.set('status', statusMessage);
    this.save_changes();
  }

  private validateIPaddress(ipAddress: string) {
    // TODO: validate port also
    if (ipAddress == 'nao.local') {
      return true;
    } else {
      const regexp = new RegExp('^((25[0-5]|(2[0-4]|1[0-9]|[1-9]|)[0-9])(\.(?!$)|$)){4}$');
      return regexp.test(ipAddress);
    }
  }

  async connect(ipAddress: string, port: string) {
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    this.changeStatus('Establishing connection');

    if (!this.validateIPaddress(ipAddress)) {
      this.changeStatus('Invalid IP address');
      console.warn('IP Address ', ipAddress, ' is not valid');
      return;
    }

    this.qiSession = new QiSession(ipAddress, port);

    // Timeout after ~10 seconds
    for (let i = 0; i < 100; i++) {
      await sleep(100);
      if (this.qiSession.isConnected()) {
        this.connected = 'Connected';
        this.set('connected', 'Connected');
        this.save_changes();
        this.changeStatus('Available');
        console.log("Connection successful after ", i/10.0, " seconds.");
        break;
      }
    }

    // Handle connection failure
    if (!this.qiSession.isConnected()) {
      console.error("Connection to ", ipAddress, " could not be established.");
      this.changeStatus('Unavailable');
    }    
  }

  disconnect() {
    console.log('REMOVE disconnecting');
    // TODO: Make disconnect function
    // delete this.qiSession;
    this.connected = 'Disconnected';
    this.changeStatus('Unavailable');
  }


  private async createService(
    serviceName: string,
  ) {
    this.changeStatus('Creating service ' + serviceName);
    const servicePromise = this.qiSession.service(serviceName);

    const naoService = await servicePromise.then(
      (resolution: object) => {
        return resolution;
      }
    ).catch(
      (rejection: string) => {
        this.changeStatus(rejection);
        return rejection;
      }
    );

    // Store service only when successfully created
    if (typeof(naoService) === 'object') {
      this._services[serviceName] = naoService;
      this.changeStatus(serviceName + ' available');
    }
  }

  private async callService(
    serviceName: string,
    methodName: string,
    args: any,
    _kwargs: any
  ) {
    if (this._services[serviceName][methodName] === undefined) {
      this.changeStatus(methodName + ' does not exist for ' + serviceName);
      return;
    }

    // let serviceResponse;
    this.changeStatus('Running method ' + methodName);

    const servicePromise = this._services[serviceName][methodName](...args);
    await servicePromise.then(
      (resolution: any) => {
        this.changeStatus('Task completed');
        if (resolution !== undefined) {
          this.send(resolution)
        }
      }
    ).catch(
      (rejection: string) => {
        this.changeStatus(rejection);
        this.send(rejection);
      }
    );

    this.set('counter', this.get('counter') + 1);
    this.save_changes();
  }

  private async onCommand(commandData: any, buffers: any) {
    const cmd = commandData['command'];
    
    switch (cmd) {
      case 'connect':
        await this.connect(commandData['ipAddress'], commandData['port']);
        break;

      case 'disconnect':
        this.disconnect();
        break;

      case 'createService':
        this.createService(commandData['service']);
        break;

      case 'callService':
        await this.callService(
          commandData['service'],
          commandData['method'],
          commandData['args'],
          commandData['kwargs']
        );
        break;
    }

  }

  static serializers: ISerializers = {
    ...DOMWidgetModel.serializers,
    // Add any extra serializers here
  };

  static model_name = 'NaoRobotModel';
  static model_module = MODULE_NAME;
  static model_module_version = MODULE_VERSION;
  static view_name = 'NaoRobotView'; // Set to null if no view
  static view_module = MODULE_NAME; // Set to null if no view
  static view_module_version = MODULE_VERSION;
}

export class NaoRobotView extends DOMWidgetView {
  txt_connected: HTMLDivElement;
  txt_status: HTMLDivElement;

  render() {
    this.el.classList.add('custom-widget');

    // Connection element
    this.txt_connected = document.createElement('div');
    this.txt_connected.textContent = 'Disconnected';
    this.el.appendChild(this.txt_connected);

    // Status element
    this.txt_status = document.createElement('div');
    this.txt_status.textContent = 'Not busy';
    this.el.appendChild(this.txt_status);

    this.value_changed();
    this.model.on('change:connected', this.value_changed, this);
    this.model.on('change:status', this.value_changed, this);
  }

  value_changed() {
    this.txt_connected.textContent = this.model.get('connected');
    this.txt_status.textContent = this.model.get('status');
  }
}
