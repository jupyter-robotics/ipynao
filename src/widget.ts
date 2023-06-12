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

  defaults() {
    return {
      ...super.defaults(),
      _model_name: NaoRobotModel.model_name,
      _model_module: NaoRobotModel.model_module,
      _model_module_version: NaoRobotModel.model_module_version,
      // _model_id: NaoRobotModel.model_id,
      _view_name: NaoRobotModel.view_name,
      _view_module: NaoRobotModel.view_module,
      _view_module_version: NaoRobotModel.view_module_version,
      value: 'Hello World',
    };
  }

  initialize(attributes: any, options: any): void {
    super.initialize(attributes, options);
    // this.qiSession = new QiSession();
    console.log("INI JS");

    // this.on("msg:custom", async (command: any, buffers: any) => {
    //   this.onCommand(command, buffers);
    //   console.log("RRR msg:custom");
    // })
  }

  // async connect() {
  //   if (!this.qiSession.isConnected) {
  //     console.log("RRR not connected, trying again");
  //     this.qiSession = new QiSession();
  //   }
  // }

  // private async onCommand(command: any, buffers: any) {
  //   console.log("onCommand", command);
  //   const cmd = command["command"];
    
  //   if (cmd === "connect") {
  //     console.log("RRR the command was connect");
  //     await this.connect();
  //   }
  // }

  static serializers: ISerializers = {
    ...DOMWidgetModel.serializers,
    // Add any extra serializers here
  };

  static model_name = 'NaoRobotModel';
  static model_module = MODULE_NAME;
  static model_module_version = MODULE_VERSION;
  // static model_id = 'NaoRobotID';
  static view_name = 'NaoRobotView'; // Set to null if no view
  static view_module = MODULE_NAME; // Set to null if no view
  static view_module_version = MODULE_VERSION;
}

export class NaoRobotView extends DOMWidgetView {
  render() {
    this.el.classList.add('custom-widget');

    this.value_changed();
    this.model.on('change:value', this.value_changed, this);
  }

  value_changed() {
    this.el.textContent = this.model.get('value');
  }
}
