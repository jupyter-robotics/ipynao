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
      synco: "something silly",
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

  async Testing() {
    this.qiSession = new QiSession();
    const tts = await this.qiSession.service("ALTextToSpeech");
    // let msg : any = Object.getOwnPropertyNames(tts);
    let aThing: any = this.send(tts);
    console.log("A thing: ", aThing);
    console.log("JS sent something");
  }

  async goSleep(tSeconds : number) {
    console.log("IN THE SLEEPING SESH")
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    await sleep(tSeconds * 1000);

    console.log("WAKING UP");

    this.set("synco", "something else");
    this.save_changes();
    console.log("SETTED THE VALUE");

  }

  private async onCommand(commandData: any, buffers: any) {
    console.log("REMOVE onCommand", commandData);
    const cmd = commandData["command"];

    if (cmd === "goSleep") {
      console.log("GOING TO SLEEP");
      await this.goSleep(commandData["tSeconds"]);
      console.log("AFTER BEAUTY NAP");
    }

    if (cmd === "Testing") {
      console.log("JS about to test");
      await this.Testing();
      console.log("JS after await");
    }
    
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



    console.log("End of OnCommand")
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

  render() {
    this.el.classList.add('custom-widget');

    // Testing element
    // connected
    this.synco = document.createElement('div');
    this.synco.textContent = this.model.get('synco');
    this.el.appendChild(this.synco);

    this.value_changed();
    this.model.on('change:synco', this.value_changed, this);
  }

  value_changed() {
    this.el.textContent = this.model.get('value');
    this.synco = this.model.get('synco');
  }
}
