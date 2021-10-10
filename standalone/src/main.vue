<template>
<div>
  <b-navbar sticky style="z-index: 1090;" variant="primary" type="dark">
    <b-button v-b-toggle.menu variant="primary"><b-icon-list scale="1.5"></b-icon-list></b-button>
    <b-navbar-brand class="ml-3"></b-navbar-brand>
  </b-navbar>
  <b-sidebar id="menu" v-model="isMenu" backdrop no-header shadow z-index="1089" bg-variant="dark" body-class="overflow-hidden">
    <b-tabs
      v-on:input="isMenu=false"
      v-model="pageIndex" 
      vertical 
      pills 
      fill
      nav-wrapper-class="w-100">
      
      <b-tab title="Play" active></b-tab>
      <b-tab title="Player Info"></b-tab>
      <b-tab title="Author Info"></b-tab>
      <b-tab title="Legal Info"></b-tab>
    </b-tabs>
  </b-sidebar>

  <b-container fluid="lg" v-show="pageIndex === 0">
    <b-card class="text-center">
      <b-form>
        <b-form-group label-for="log" label-cols="auto">
          <b-img src="./img/logo.png" fluid alt="WWWall: Undo Evil!" class="w-75" style="margin-top: -3em;"></b-img>
        </b-form-group>

        <b-form-group label-for="playlist-file" label-cols="auto">
          <b-form-file
            placeholder="Select ZIP playlist"
            accept=".zip"
            v-model="playPage.playlistFile"
            v-on:change="commandLoad"
            :state="Boolean(playPage.playlistFile)"
            id="file-field"
            type="file"
            class="form-control"
            plain>
          </b-form-file>
        </b-form-group>

        <b-form-group 
          label-for="play-alert" 
          label-cols="auto" 
          v-if="playPage.playlistFile && !playPage.isStarted && !playPage.isWaitingStart"
          style="margin-top: -1em"
        >
          <b-alert id="play-alert" show>Press play!</b-alert>
        </b-form-group>

        <b-form-group label-for="wait-alert" label-cols="auto" v-if="playPage.isWaitingStart" style="margin-top: -1em">
          <b-alert
            :show="playPage.waitTimeProgress"
            id="wait-alert"
            variant="warning"
            @dismiss-count-down="waitCountDown"
            style="margin-top: -1em"
          >
            <p>The audio will play in {{ humanizeDuration(playPage.waitTimeProgress * 1000) }}.</p>
            <b-progress
              variant="warning"
              :max="playPage.waitTime"
              :value="playPage.waitTimeProgress"
              height="4px"
            ></b-progress>
          </b-alert>
        </b-form-group>

        <b-form-group><h5>{{ playPage.title }}</h5></b-form-group>
        <b-form-group label-for="audio-file" label-cols="auto" style="margin-top: -1em">
          <audio currentTime=2 controls id="audio-file" :src="playPage.audioURL" type="audio/mpeg" v-on:play="play" v-on:ended="ended">
          </audio>
        </b-form-group>

        <b-form-group  label="Offset (ms)" label-for="offset">
          <round-slider
            id="offset"
            v-model="playPage.offsetPointer.offset"
            min=-2000
            max=2000
            step=100
            start-angle="22.5"
            end-angle="157.5"
            circle-shape="full"
            line-cap="round"
            class="mx-auto"
            border-width=1
            range-color="#f00"
            path-color="#4f4f4f"
          />
        </b-form-group>
        
      </b-form> 
    </b-card>
  </b-container>
  
  <b-container fluid="lg" v-if="pageIndex === 1">
    <b-card title="Player Info">
      <b-form>
        <div v-html="user"></div>
      </b-form> 
    </b-card>
  </b-container>

  <b-container fluid="lg" v-if="pageIndex === 2">
    <b-card title="Author Info">
      <b-form>
        <div v-html="author.part1"></div>
        <input
          id="author-datepicker"
          v-model="authorDateTime"
          type="datetime-local"
          placeholder="Date and time"
          class="form-control"
        />
        <br>
        <p>And put the following line at the end of the .pls file:</p>
        <strong>StartTime={{new Date(authorDateTime).getTime()}}</strong><br>
        <br>
        <div v-html="author.part2"></div>
      </b-form> 
    </b-card>
  </b-container>
  
  <b-container fluid="lg" v-if="pageIndex === 3">
    <b-card title="Legal Info" class="text-center">
      <b-form>
        <div v-html="legal"></div>
      </b-form> 
    </b-card>
  </b-container>
</div>
</template>

<style>
  @import './index.css';
</style>

<script lang="ts">
  import FlatPromise from "flat-promise";
  import Vue from 'vue';
  import RoundSlider from 'vue-round-slider';

  import JSZip from 'jszip';
  import { StarkSequencer } from "stark-sequencer";

  import { Playlist } from "./services/playlist";
  import { CommandType } from "./objectmodels/command";

  import { MediaCommand } from "./objectmodels/mediaCommand";

  const playlistService = new Playlist();
  var flatPromise = new FlatPromise();
  var audioElement;
  
  var trackIndex = 0;
  var tracksOffset = 0;

  var unsubscribe;

  var command = new MediaCommand();
  var monitor;

  var prePlayPromise = new FlatPromise();
  var resetPromise = new FlatPromise();

  export default Vue.extend({
    name: 'Main',
    components: {
      RoundSlider
    },
    data: () => {
      return {
        humanizeDuration: require("humanize-duration"),
        legal: require("./docs/legal").default,
        user: require("./docs/user").default,
        author: require("./docs/author").default,
        isMenu: false,
        pageIndex: 0,
        command: command,
        CommandType: CommandType,
        playPage: {
          playlistFile: null,
          audioURL: null,
          title: null,
          offsetPointer: StarkSequencer.offsetPointer,
          isStarted: false,
          isWaitingStart: false,
          waitTime: 0,
          waitTimeProgress: 0
        },
        authorDateTime: new Date().toISOString().replace(/\:[^\:]*$/gm, '')
      };
    },
    mounted: async function () {
      StarkSequencer.init();

      command.eventEmitter.on('change', async commandState => {
        try {
          if (commandState.commandType === CommandType.Play) {
            await this.resetTrack();
            await audioElement.load();
            // await audioElement.play();
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

      // Sync to the UTC clock.
      // let post;
      // let result = await fetch(`http://worldtimeapi.org/api/timezone/Etc/UTC`, {
      //   method: 'GET',
      //   headers: { 'Accept': 'application/json' }
      // });
      // post = Date.now();
      // let json  = await result.json();
      // StarkSequencer.offsetPointer.offset = (new Date(json.utc_datetime).getTime() - post) / 2;
    },
    methods: {
      play: async function (event) {
        audioElement = audioElement || event.currentTarget;
        
        if (!command.state.startTime || command.state.commandType !== CommandType.Play) {
          await audioElement.pause();
          return;
        } 
        
        if (Date.now() + StarkSequencer.offsetPointer.offset - command.state.startTime < 0){
          await audioElement.pause();
          if (this.playPage.isWaitingStart) {
            return;
          }

          let waitTime = command.state.startTime - (Date.now() + StarkSequencer.offsetPointer.offset);
          this.playPage.waitTime = Math.round(waitTime/1000);
          this.playPage.waitTimeProgress = Math.round(waitTime/1000);
          let timeout = setTimeout(() => prePlayPromise.resolve(), waitTime);

          try {
            this.playPage.isWaitingStart = true;
            this.$forceUpdate();
            await prePlayPromise.promise;
            this.playPage.isWaitingStart = false;
            this.$forceUpdate();
          } catch {
            clearTimeout(timeout);
            this.playPage.isWaitingStart = false;
            this.playPage.isStarted = false;
            this.$forceUpdate();
            return;
          }
          
          await audioElement.play();
        }

        if (this.playPage.isStarted) { return; }
        this.playPage.isStarted = true;        
        this.$forceUpdate();

        monitor = StarkSequencer.monitor({
          length: 14.4e6,
          pollCallback: () => {
            let curTime = audioElement.currentTime; 
            curTime = isNaN(curTime) ? tracksOffset : tracksOffset + curTime  * 1e3;

            return curTime;
          },
          start: command.state.startTime + command.state.sumPauseTime,
          pollInterval: 6e2,  // In milliseconds, min 15ms. Default: 100ms.
          diffInterval: 150,  // Margin of error in milliseconds. Default: 100ms.
        });

        unsubscribe = monitor.state.subscribe((_mutation, state) => {
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
        this.playPage.isStarted = false;
        if (flatPromise) { 
          flatPromise.reject(); 
        }
       
        flatPromise = new FlatPromise();
        monitor.delete();
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

        let temp = prePlayPromise;
        prePlayPromise = new FlatPromise();
        temp.reject();
        this.playPage.isStarted = false;

        resetPromise.resolve();
      },
      resetTrack: async function () {
        trackIndex = 0;
        tracksOffset = 0;

        if (!(command && command.state && command.state.startTime)) {
          return;
        }

        let timeNow = Date.now() + StarkSequencer.offsetPointer.offset - (command.state.startTime + command.state.sumPauseTime);

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
      waitCountDown(newSec) {
        this.playPage.waitTimeProgress = newSec;
      },
      commandLoad: async function (event) {
        let playlistFile = event.currentTarget.files[0];
        let playlistFileContents;

        if (!playlistFile.name.endsWith('.zip')) {
          this.playPage.playlistFile = false;
          return;
        }

        playlistFileContents = await readFileAsync(playlistFile);

        command.attachment = playlistFileContents;
        command.state = {...command.state, ...{
          commandType: CommandType.Stop,
          startTime: undefined,
          pauseTime: undefined,
          sumPauseTime: 0
        }};
        await command.save();

        await resetPromise.promise;
        resetPromise = new FlatPromise();
        await this.commandPlay();
      },
      commandPlay: async function () {
        if (!command.state) {
          console.error("Command was not initialized.");
        }

        if (command.state.commandType === CommandType.Play) {
          command.state.commandType = CommandType.Pause;
          command.state.pauseTime = Date.now() + StarkSequencer.offsetPointer.offset;
        } else if (command.state.commandType === CommandType.Pause) {
          command.state.commandType = CommandType.Play;
          command.state.sumPauseTime += (Date.now() + StarkSequencer.offsetPointer.offset) - command.state.pauseTime;
          command.state.pauseTime = undefined;
        } else if (command.state.commandType === CommandType.Stop) {
          command.state.commandType = CommandType.Play;
          command.state.startTime = playlistService.startTime;
          command.state.sumPauseTime = 0;
          command.state.pauseTime = undefined;
        }

        await command.save();
      },
      commandStop: async function () {
        command.state.commandType = CommandType.Stop;
        command.state.startTime = undefined;
        command.state.pauseTime = undefined;
        command.state.sumPauseTime = 0;
        await command.save();
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