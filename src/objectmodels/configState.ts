import { ObjectModel } from "objectmodel";
import assert from 'browser-assert';
import config from '../../config';

export class ConfigState {
  arg: any;
  argValid: any;
  validate: boolean;

  static isInit = false;
  static state: any;
  
  string: string;
  
  /**
   * Creates an instance of the config.
   * @param [arg.db]
   * @param [arg.arg]
   * @param [validate] Is necessary because the arg could be used to load (future).
   */
  constructor(validate = false) {
    this.arg = config;
    this.validate = validate;
    this.init();
  }

  init() {
    if (ConfigState.isInit) { return; }
    this.validateNew();
    this.save();
    ConfigState.isInit = true;
  };
  
  /**
   * Parses the config.
   * @param arg 
   */
  parse(arg: string) {
    this.arg = JSON.parse(arg);
    this.validateNew();
  }
  
  load() {
    return ConfigState.state;
  }

  save() {
    if (ConfigState.state) { return; }
    ConfigState.state = { ...{ config }, ...this.argValid};
    this.validateState();
  }

  toString() {
    this.string = JSON.stringify(ConfigState.state);
  }
  
  async delete() { throw new Error("This method is not implemented."); }

  // :() Constructor type?
  private newConfigModel = ObjectModel({
    arg: Object,
    config: ObjectModel({
      STARK_HOST: String,
      STARK_PORT: String,
      STARK_DB_HOST: String,
      STARK_SERVICES_NAME: String,
      STARK_SERVICES_PASSWORD: String
    })    
  });

  private validateNew() {
    this.argValid = this.validate ? new this.newConfigModel(this.arg) : this.arg;
  }

  private validateState() {
    assert(!!ConfigState.state);
  }
  
}