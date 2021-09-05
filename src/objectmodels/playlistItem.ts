import assert from "browser-assert";
import { ObjectModel } from "objectmodel";

export class PlaylistItem {
  arg: any;
  argValid: any;
  validate: boolean;
  
  state: any;

  string: string;
  
  constructor(arg,  validate = false) {
    this.arg = arg;
    this.validate = validate;
    this.validateNew();
  }

  parse(arg: string) {
    this.arg = JSON.parse(arg);
    this.validateNew();
  }

  async init() { throw new Error("This method is not implemented."); }

  async load() {
    if (this.state) { return this.state.URL; }

    await this.save();
    this.validateState();
    return this.state.URL;
  }

  async save() {
    let blob = new File( [this.argValid.content], `${this.argValid.title}.mp3`, { type: 'audio/mpeg' } );	
    this.state = {
      URL: URL.createObjectURL(blob)
    };
  }

  toString() {
    this.string = JSON.stringify(this.state);
  }

  async delete() {
    URL.revokeObjectURL(this.state.URL)
    this.state = undefined;
  }

  private newItemModel = ObjectModel({
    title: String,
    length: Number,
    content: ArrayBuffer
  });

  private validateNew() {
    this.argValid = this.validate ? new this.newItemModel(this.arg) : this.arg;
  }

  private validateState() {
    assert(!!this.state);
  }
  
}