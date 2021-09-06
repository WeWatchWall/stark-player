<template>
<div>
  <b-navbar sticky style="z-index: 1090;" variant="primary" type="dark">
    <b-button v-b-toggle.menu variant="primary" pill><b-icon-list></b-icon-list></b-button>
    <b-navbar-brand class="ml-3">Stark mp3 Player</b-navbar-brand>
  </b-navbar>
  <b-sidebar id="menu" v-model="isMenu" backdrop no-header shadow z-index="1089" bg-variant="light" body-class="overflow-hidden">
    <b-tabs
      v-on:input="isMenu=false"
      v-model="pageIndex" 
      vertical 
      pills 
      fill
      class="mt-5" nav-wrapper-class="w-100">
      
      <b-tab title="Play" active></b-tab>
      <b-tab title="Control"></b-tab>
    </b-tabs>
  </b-sidebar>

  <b-container fluid="lg" v-show="pageIndex === 0">
    <b-card title="Play" class="text-center">
      <b-form>
        <b-form-group  :label="playPage.title"></b-form-group>
        <b-form-group label-for="audio-file" label-cols="auto">
          <audio currentTime=2 controls id="audio-file" :src="playPage.audioURL" type="audio/mpeg" v-on:play="play" v-on:ended="ended">
          </audio>
        </b-form-group>

        <b-form-group  label="Offset (ms)" label-for="offset">
          <round-slider
            id="offset"
            v-model="playPage.offsetPointer.offset"
            min=-2500
            max=2500
            step=100
            start-angle="45"
            end-angle="135"
            circle-shape="full"
            line-cap="round"
            class="mx-auto"
          />
        </b-form-group>
        
      </b-form> 
    </b-card>
  </b-container>
  
  <b-container fluid="lg" v-show="pageIndex === 1">
    <b-card title="Commands" class="text-center">
      <b-form>
        <b-form-group label="1. Playlist file" label-for="playlist-file" label-cols="auto">
          <b-form-file 
            accept=".zip"  
            v-model="commandPage.playlistFile"
            v-on:change="commandLoad"
            :state="Boolean(commandPage.playlistFile)"
            id="playlist-file">
          </b-form-file>
        </b-form-group>

        <b-form-group label="2. Controls" label-for="controls" label-cols="auto" v-if="command && command.state && command.state.attachments">
          <div id="controls">
            <b-button variant="primary" pill v-on:click="commandPlay">
              <b-icon-play v-show="command && command.state && (command.state.commandType === CommandType.Pause || command.state.commandType === CommandType.Stop)"></b-icon-play>
              <b-icon-pause v-show="command && command.state && command.state.commandType === CommandType.Play"></b-icon-pause>
            </b-button>
            <b-button variant="primary" pill v-on:click="commandStop"><b-icon-stop-fill></b-icon-stop-fill></b-button>
          </div>
        </b-form-group>       
      </b-form> 
    </b-card>
  </b-container>
</div>
</template>

<style>
  /* @import './dist/index.css'; */
</style>

<script lang="ts">
  import FlatPromise from "flat-promise";
  import Vue from 'vue';
  import RoundSlider from 'vue-round-slider'

  import JSZip from 'jszip';
  import { StarkSequencer } from "stark-sequencer";

  import { Playlist } from "./services/playlist";
  import { CommandType } from "./objectmodels/command.js";
  import { MediaCommand } from "./objectmodels/mediaCommand";
import { ConfigState } from "./objectmodels/configState";

  const playlistService = new Playlist();
  var flatPromise = new FlatPromise();
  var audioElement;
  
  var trackIndex = 0;
  var tracksOffset = 0;

  var isStarted = false;
  var unsubscribe;

  var command = new MediaCommand();

  export default Vue.extend({
    name: 'Main',
    components: {
      RoundSlider,
    },
    data: () => {
      return {
        isMenu: false,
        pageIndex: 0,
        command: command,
        CommandType: CommandType,
        playPage: {
          audioURL: null,
          title: null,
          offsetPointer: StarkSequencer.offsetPointer
        },
        commandPage: {
          playlistFile: null,
          isPlay: false
        }
      };
    },
    mounted: async function () {
      StarkSequencer.init({
        isSync: true,
        host: `http://${ConfigState.state.STARK_HOST}:${ConfigState.state.STARK_PORT}`
      });

      command.eventEmitter.on('change', async commandState => {
        try {
          if (commandState.commandType === CommandType.Play) {
            await this.resetTrack();
            await audioElement.load();
            await audioElement.play();
          } else if (commandState.commandType === CommandType.Pause) {
            await this.pause();
          }
          else if (commandState.commandType === CommandType.Stop) {
            await this.pause();
          }
        } catch (error) {
        }
        
      });

      command.eventEmitter.on('reset', async () => {
        await this.reset();
      });
      
      await command.init();
    },
    methods: {
      play: async function (event) {
        if (isStarted) { return; }
        audioElement = audioElement || event.currentTarget;
        if (!command.state.startTime) {
          await audioElement.pause();
          return;
        }
        isStarted = true;

        let monitor = StarkSequencer.monitor({
          length: 14.4e6,
          pollCallback: () => {
            let curTime = audioElement.currentTime; 
            curTime = isNaN(curTime) ? tracksOffset : tracksOffset + curTime  * 1e3;

            return curTime;
          },
          start: command.state.startTime + (command.state.unpauseTime ? command.state.unpauseTime - command.state.pauseTime : 0),
          pollInterval: 5e2,  // In milliseconds, min 15ms. Default: 100ms.
          diffInterval: 2e2,  // Margin of error in milliseconds. Default: 100ms.
        });

        unsubscribe = monitor.subscribe((_mutation, state) => {
          audioElement.currentTime = (state.time - tracksOffset) / 1e3;
        });

        for (let index = trackIndex + 1; index < playlistService.items.length; index++) {
          try {
            await flatPromise.promise;
          } catch {
            break;
          }
          
          tracksOffset += playlistService.items[index-1].argValid.length * 1e3;
          this.playPage.audioURL = await playlistService.items[index].load();
          this.playPage.title =  playlistService.items[index].argValid.title;
          await audioElement.load();
          await audioElement.play();

          if (command.state.commandType === CommandType.Pause) {
            await audioElement.pause();
          }
        }
        
      },
      ended: async function () {
        let temp = flatPromise;
        flatPromise = new FlatPromise();
        temp.resolve();
      },
      pause : async function () {
        isStarted = false;
        if (flatPromise) { 
          flatPromise.reject(); 
        }
       
        flatPromise = new FlatPromise();
        StarkSequencer.monitorService.delete(0);
        unsubscribe();
        await audioElement.pause();
      },
      reset: async function () {
        try {
          await this.pause();
        } catch (error) {
        }

        for (let index = 0; index < playlistService.items.length; index++) {
          await playlistService.delete(index);
        }
        
        let zip = new JSZip();
        let zipContent = await zip.loadAsync(command.attachment);

        let items = [];
        for (let filename of Object.keys(zipContent.files)) {
          let fileContent;

          if (filename.endsWith('.pls')) { 
            fileContent = await ((zip.file(filename)).async('string'));
            await playlistService.init(fileContent);
            continue;
          } else if (!filename.endsWith('.mp3')) {
            continue;
          }

          items.push({
            filename,
            content: zip
          });
        }

        for (const item of items) {
          await playlistService.add({
            title: playlistService.order[item.filename].title,
            fileName: item.filename,
            length: playlistService.order[item.filename].length,
            content: item.content
          });
        }

        this.resetTrack();
        this.playPage.audioURL = await playlistService.items[trackIndex].load();
        this.playPage.title =  playlistService.items[trackIndex].argValid.title;
      },
      resetTrack: async function () {
        trackIndex = 0;
        tracksOffset = 0;

        if (!(command && command.state && command.state.startTime)) {
          return;
        }
        
        let timeNow = Date.now() + StarkSequencer.offsetPointer.offset -
          (command.state.startTime + (command.state.pauseTime ? (command.state.unpauseTime || Date.now()) - command.state.pauseTime : 0));

        let index = 0;
        let timeIndex = playlistService.items[index].argValid.length * 1e3 ;

        while (timeIndex < timeNow) {
          if (index > 0) { tracksOffset += playlistService.items[index - 1].argValid.length * 1e3; }
          trackIndex = index;

          index++;
          if (index === playlistService.items.length) { break; }

          timeIndex += playlistService.items[index].argValid.length * 1e3;
        }

        // Weird code: detects if the reset needed any fast-forwarding. 
        if (index > 0 && index < playlistService.items.length) {
          tracksOffset += playlistService.items[index - 1].argValid.length * 1e3;
          trackIndex = index;
        }

        this.playPage.audioURL = await playlistService.items[trackIndex].load();
        this.playPage.title =  playlistService.items[trackIndex].argValid.title;
      },
      commandLoad: async function (event) {
        let playlistFile;
        playlistFile = await readFileAsync(event.currentTarget.files[0]);
        command.attachment = playlistFile;
        command.state = {...command.state, ...{
          commandType: CommandType.Stop,
          isReset: true,
          startTime: undefined,
          pauseTime: undefined,
          unpauseTime: undefined
        }};
        await command.save();
      },
      commandPlay: async function () {
        if (!command.state) {
          command.state = {
            command: CommandType.Play,
            startTime: Date.now() + StarkSequencer.offsetPointer.offset
          };
          await command.save();
          return;
        }

        if (command.state.commandType === CommandType.Play) {
          command.state.commandType = CommandType.Pause;
          command.state.pauseTime = Date.now() + StarkSequencer.offsetPointer.offset;
        } else if (command.state.commandType === CommandType.Pause) {
          command.state.commandType = CommandType.Play;
          command.state.unpauseTime = Date.now() + StarkSequencer.offsetPointer.offset;
        } else if (command.state.commandType === CommandType.Stop) {
          command.state.commandType = CommandType.Play;
          command.state.startTime = Date.now() + StarkSequencer.offsetPointer.offset;
          command.state.pauseTime = undefined;
          command.state.unpauseTime = undefined;
        }

        await command.save();
        this.$forceUpdate();
      },
      commandStop: async function () {
        command.state.commandType = CommandType.Stop;
        command.state.startTime = undefined;
        command.state.pauseTime = undefined;
        command.state.unpauseTime = undefined;
        await command.save();
        this.$forceUpdate();
      }
    }
  });

  function readFileAsync(file) {
    return new Promise((resolve, reject) => {
      let reader = new FileReader();

      reader.onload = () => {
        resolve(reader.result);
      };

      reader.onerror = reject;

      reader.readAsArrayBuffer(file);
    });
  }
</script>