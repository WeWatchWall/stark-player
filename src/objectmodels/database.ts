import { ObjectModel } from 'objectmodel';
import { Buffer } from 'buffer';
import PouchDB from 'pouchdb-browser';
import find from 'pouchdb-find';
import rel from 'relational-pouch';
import assert from 'browser-assert';

PouchDB
  // .plugin(someadapter)
  .plugin(require('pouchdb-security-helper')) 
  .plugin(require('pouchdb-authentication'))
  .plugin(find)
  .plugin(rel);

export class Database {
  arg: any;
  argValid: any;
  state: any;
  validate: boolean;

  dbServer: String;
  username: String;
  password: String; 
  dbName: string;
  string: string;
  
  constructor(arg = { arg: {}, username: undefined, password: undefined},  validate = false) {
    this.arg = arg.arg;
    this.username = arg.username;
    this.password = arg.password;
    this.validate = validate;
  }
    
  init(): void { 
    throw new Error("This method is not implemented.");
  }
  
  parse(arg: string) {
    this.arg = JSON.parse(arg);
    this.validateNew();
  }
  
  async load() { 
    this.validateNew();
    let dbName = `userdb-${Buffer.from(this.argValid.username, 'utf8').toString('hex')}`;
    this.dbName = dbName;
    
    // skip_setup: true, auth: { username: "admin", password: "mLHhxiForA1ebt7V1lT1" }
    let address = `http://${this.username}:${this.password}@${this.argValid.dbServer}:5984`;

    this.state = new PouchDB(`${address}/${this.dbName}`, {
      skip_setup: true
    });

    this.validateState();
  }
    
    // NOOP
  async save() {
  }

  toString() {
    this.string = JSON.stringify(this.state);
  }
    
    // NOOP, just DELETE THE USER...
    async delete() {
  }

  private newDatabaseModel = ObjectModel({
      username: String,
      dbServer: String
    }).assert(
      newDatabase => {
        // TODO
        return newDatabase
            && RegExp('^[a-z0-9_-]{3,75}$').test(newDatabase.username);
        
    }
  );
  
  private validateNew() {
    this.argValid = this.validate ? new this.newDatabaseModel(this.arg) : this.arg;
  }
  
  private validateState() {
    assert(this.state);
  }
  
}