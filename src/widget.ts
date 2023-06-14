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
      _view_name: NaoRobotModel.view_name,
      _view_module: NaoRobotModel.view_module,
      _view_module_version: NaoRobotModel.view_module_version,
      value: 'Hello World',
    };
  }

  initialize(attributes: any, options: any): void {
    super.initialize(attributes, options);
  
    this.on("msg:custom", this.onCommand);
  }

  async connect(ipAddress: any) {
    console.log("REMOVE the command was to connect");
    this.qiSession = new QiSession(ipAddress);    
  }

  disconnect() {
    console.log("REMOVE disconnecting");
    // TODO: delete session or make disconnect function
  }

  async ALTextToSpeech(speech : String = "") {
    const tts = await this.qiSession.service("ALTextToSpeech");
    await tts.say(speech)
  }

  async ALLeds(tSeconds : Number = 1) {
    const leds = await this.qiSession.service("ALLeds");
    await leds.rasta(tSeconds);
  }

  async ALMotion() {
    const motion = await this.qiSession.service("ALMotion");
    await motion.wakeUp();
    await motion.rest();
  }

  private async onCommand(commandData: any, buffers: any) {
    console.log("REMOVE onCommand", commandData);
    const cmd = commandData["command"];
    
    if (cmd === "connect") {
      await this.connect(commandData["ipAddress"]);
      this.send({data: "done"});
    } else if (cmd === "disconnect") {
      this.disconnect();
    } else {
      switch (cmd) {

        case "ALTextToSpeech":
          await this.ALTextToSpeech(commandData["speech"]);
          this.send({data: "done"});
          break;

        case "ALLeds":
          await this.ALLeds(commandData["tSeconds"]);
          break;

        case "ALMotion":
          await this.ALMotion();
          break;
      };
    }

    // TODO: figure out async
    console.log("Before: ", this.get("counter"));
    let newValue : Number = this.get("counter") + 1;
    this.set("counter", newValue);
    // this.set("value", newValue);
    this.save_changes();

    console.log("After: ", this.get("counter"));
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
