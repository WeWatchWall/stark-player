import { EventEmitter } from 'events';
import { ObjectModel } from "objectmodel";
import { CommandType } from "./command.js";

export class MediaCommand {  
  arg: any;
  argValid: any;
  state: any;
  attachment: any;
  validate: boolean;
  
  string: string;
  watcher: any;
  eventEmitter = new EventEmitter();
  
  constructor(arg = {}, validate = false) {
    this.arg = arg;
    this.validate = validate;
  }
  
  async init() {
    this.validateNew();

    await this.load();
  }
  
  parse(arg: string) {
    this.arg = JSON.parse(arg);
    this.validateNew();
  }

  // NOOP
  async load() {
  }
  
  async save() {
    this.validateNew();
    this.validateState();

    if (this.state.commandType === CommandType.Stop) {
      this.eventEmitter.emit('reset');
    } else {
      this.eventEmitter.emit('change', this.state);
    }
  }
  
  toString() {
    this.validateState();
    this.string = JSON.stringify(this.state);
  }
  
  // TODO
  async delete() {
  }
  
  private stateCommandModel = ObjectModel({
    commandType: [CommandType.Play, CommandType.Pause, CommandType.Stop],
    isReset: [Boolean],
    startTime: [Number],
    pauseTime: [Number],
    unpauseTime: [Number]
  });

  private validateNew() {
    this.argValid = this.arg;
  }
    
  private validateState() {
    this.stateCommandModel(this.state);
  }
}