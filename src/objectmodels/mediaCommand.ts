import { ConfigState } from './configState.js';
import { EventEmitter } from 'events';
import { ObjectModel } from "objectmodel";
import { CommandType } from "./command.js";
import { Database } from "./database.js";


export class MediaCommand {
  db: any;
  
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

    this.db = new Database({
      arg: { username: ConfigState.state.STARK_SERVICES_NAME, dbServer: ConfigState.state.STARK_DB_HOST },
      username: ConfigState.state.STARK_SERVICES_USER_NAME,
      password: ConfigState.state.STARK_SERVICES_PASSWORD
    });
    await this.db.load();
    this.db.state.setSchema(MediaCommand.commandSchema);

    await this.load();
  }
  
  parse(arg: string) {
    this.arg = JSON.parse(arg);
    this.validateNew();
  }

  async load() {
    let init = !!this.state;

    this.state = (await this.db.state.find({
      selector: { "_id": {"$regex": "^command"} },
      limit: 1
    })).docs;
    this.state = await this.db.state.rel.parseRelDocs('command', this.state);
    this.state = this.state.commands[0];

    if (this.state && this.state.attachments) {
      this.attachment = await this.db.state.rel.getAttachment('command', this.state.id, 'playlist.zip');
      this.eventEmitter.emit('reset');
    }

    if (init) { return; }
    
    var self = this;
    // TODO: VM pattern for node(longpoll) vs browser(retry) so I can reuse these dang filed :P
    this.watcher = this.db.state.changes({
      since: 'now',
      back_off_function: function (delay) { return 20e3; },
      timeout: 1,
      heartbeat: false,
      live: true,
      retry: true,
      include_docs: true,
      selector:  { "_id": {"$regex": "^command"} }
    }).on('change', async function (change) {
      if (change.deleted) {
        self.eventEmitter.emit('delete');
        await self.delete();
        return;
      }

      let parsedChange = await self.db.state.rel.parseRelDocs('command', [change.doc]);
      parsedChange = parsedChange.commands[0];
      let prevState = self.state;
      self.state = parsedChange;
      self.validateState();

      if (!self.state.attachments || self.state.commandType === undefined) { return; }
      if (!prevState.attachments || prevState.attachments["playlist.zip"].revpos !== parsedChange.attachments["playlist.zip"].revpos) {
        self.attachment = await self.db.state.rel.getAttachment('command', self.state.id, 'playlist.zip');
        self.eventEmitter.emit('reset');
      } else {
        self.eventEmitter.emit('change', self.state);
      }
    });
  }
  
  async save() {
    this.validateNew();
    let isReset = this.state && this.state.isReset;
    if (this.state) {
      this.state.isReset = false;
      this.validateState();
    }

    this.state = { ...this.state, ...await this.db.state.rel.save('command', this.state || this.argValid) };

    this.validateState();

    if (isReset) {
      await this.db.state.rel.putAttachment('command', this.state, 'playlist.zip', this.attachment, 'text/plain');
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
  
  private static commandSchema = [
    { singular: 'command', plural: 'commands' }
  ];
}