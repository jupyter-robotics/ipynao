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
      counter: 0,
    };
  }

  initialize(attributes: any, options: any): void {
    super.initialize(attributes, options);

    this.on("msg:custom", this.onCommand);


    //   let newValue : Number = 1;
    //   this.set('counter', newValue);
    //   this.save_changes();
    // })
  }

  // async connect() {
  //   if (!this.qiSession.isConnected) {
  //     console.log("RRR not connected, trying again");
  //     this.qiSession = new QiSession();
  //   }
  // }

  private async onCommand(commandData: any, buffers: any) {
    console.log("REMOVE onCommand", commandData);
    const cmd = commandData["command"];
    
    // TODO: change to switch case
    if (cmd === "connect") {
      console.log("REMOVE the command was to connect");
      this.qiSession = new QiSession();
      let tts = await this.qiSession.service("ALTextToSpeech");
      await tts.say("hello there there");
      console.log("REMOVE tts after await");
    }

    if (cmd === "ALTextToSpeech") {
      console.log("REMOVE command texttospeech");
      let tts = await this.qiSession.service("ALTextToSpeech");
      await tts.say(commandData["speech"]);
    }

    // TODO: figure out async
    // let newValue : Number = 1;
    // this.set("counter", newValue);
    // this.save_changes();

    console.log("REMOVE counter set");
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
  render() {
    this.el.classList.add('custom-widget');

    this.value_changed();
    this.model.on('change:value', this.value_changed, this);
  }

  value_changed() {
    this.el.textContent = this.model.get('value');
  }
}
