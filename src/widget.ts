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

export class NaoRobotModel extends DOMWidgetModel {
  qiSession: QiSession;
  connected = 'Disconnected';
  status = 'Not busy';
  synco: string;

  defaults() {
    return {
      ...super.defaults(),
      _model_name: NaoRobotModel.model_name,
      _model_module: NaoRobotModel.model_module,
      _model_module_version: NaoRobotModel.model_module_version,
      _view_name: NaoRobotModel.view_name,
      _view_module: NaoRobotModel.view_module,
      _view_module_version: NaoRobotModel.view_module_version,
      value: 'Hello World',
      synco: 'something silly',
      connected: 'Disconnected',
      status: 'Not busy',
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

  async connect(ipAddress: string, port: string) {
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    this.changeStatus('Establishing connection');
    // TODO: check ipAddress is valid format
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

  async Testing() {
    this.qiSession = new QiSession();
    const tts = await this.qiSession.service('ALTextToSpeech');
    // let msg : any = Object.getOwnPropertyNames(tts);
    const aThing: any = this.send(tts);
    console.log('A thing: ', aThing);
    console.log('JS sent something');
  }

  async goSleep(tSeconds: number) {
    console.log('IN THE SLEEPING SESH');
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    await sleep(tSeconds * 1000);

    console.log('WAKING UP');

    this.set('synco', 'something else');
    this.save_changes();

    this.send({ data: 'purple' });
    console.log('SETTED THE VALUE');
  }

  private async callService(
    serviceName: string,
    methodName: string,
    args: any,
    _kwargs: any
  ) {
    const naoService = await this.qiSession.service(serviceName);

    this.changeStatus('Running method' + methodName);
    await naoService[methodName](...args);

    this.changeStatus('Task completed');
  }

  private async onCommand(commandData: any, buffers: any) {
    console.log('REMOVE onCommand', commandData);
    const cmd = commandData['command'];

    switch (cmd) {
      case 'connect':
        await this.connect(commandData['ipAddress'], commandData['port']);
        break;

      case 'disconnect':
        this.disconnect();
        break;

      case 'callService':
        console.log('RECEIVING COMMAND FOR SERVICE');
        await this.callService(
          commandData['service'],
          commandData['method'],
          commandData['args'],
          commandData['kwargs']
        );
        break;
    }

    console.log('End of OnCommand');
  }

  static serializers: ISerializers = {
    ...DOMWidgetModel.serializers,
    // Add any extra serializers here
  };

  // var qiSession = // TODO:
  static model_name = 'NaoRobotModel';
  static model_module = MODULE_NAME;
  static model_module_version = MODULE_VERSION;
  static view_name = 'NaoRobotView'; // Set to null if no view
  static view_module = MODULE_NAME; // Set to null if no view
  static view_module_version = MODULE_VERSION;
}

export class NaoRobotView extends DOMWidgetView {
  synco: HTMLDivElement;
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

    // Testing element
    this.synco = document.createElement('div');
    this.synco.textContent = 'it should be here';
    this.el.appendChild(this.synco);

    console.log('RENDERING');
    console.log(this.model.get('connected'), ' CONNECTED');
    console.log(this.model.get('synco'), ' SYNCO');

    this.value_changed();
    this.model.on('change:connected', this.value_changed, this);
    this.model.on('change:status', this.value_changed, this);
    this.model.on('change:synco', this.value_changed, this);
  }

  value_changed() {
    // this.el.textContent = this.model.get('value');
    // this.synco = this.model.get('synco');
    console.log('THE VALUE CHANGED');
    this.txt_connected.textContent = this.model.get('connected');
    this.txt_status.textContent = this.model.get('status');
    this.synco.textContent = this.model.get('synco');
  }
}
