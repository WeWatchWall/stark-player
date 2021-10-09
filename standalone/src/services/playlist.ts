import * as envfile from 'envfile';
import { PlaylistItem } from "../objectmodels/playlistItem";

export class Playlist {
  items = [];
  order = {};
  length = 0;

  argValid;
  startTime;

  async init(playlistArg) {
    playlistArg = playlistArg.replace('[playlist]', '');
    this.argValid = envfile.parse(playlistArg);

    if (this.argValid.StartTime === 'Dynamic') {
      this.startTime = Math.ceil(Date.now() / 60e3) * 60e3;
    } else {
      this.startTime = this.argValid.startTime;
    }
    
    for (let index = 0; index < this.argValid.NumberOfEntries; index++) {
      let fileName = this.argValid[`File${index+1}`];
      let title = this.argValid[`Title${index + 1}`];
      let length = this.argValid[`Length${index + 1}`];

      this.order[fileName] = { index, fileName, title, length };
      this.length += length;
    }
  }

  async add(arg) {
    let item = new PlaylistItem(arg);

    let index = this.order[item.argValid.fileName].index;
    this.items[index] = item;

    return item;
  }

  async delete(index: number) {
    let item = this.items[index];
    await item.delete();
    this.order[item.argValid.title] = undefined;
    this.items = this.items.splice(index, 1);
  }
}