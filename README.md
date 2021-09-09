# Mp3 Player Drone Running on the Stark Orchestrator in Browsers

[![Build and test status](https://github.com/WeWatchWall/stark-player/workflows/Lint%20and%20test/badge.svg)](https://github.com/WeWatchWall/stark-player/actions?query=workflow%3A%22Lint+and+test%22)
[![NPM version](https://img.shields.io/npm/v/stark-player.svg)](https://www.npmjs.com/package/stark-player)

UI package for playing .PLS playlists of MP3 files, running in the browser, on the Stark Orchestrator.

## Getting Started

The Stark-Server project that runs the Stark Orchestrator Core or Edge needs to have been initialized. 
Then, the following commands will use $STARK_HOME/.env to deploy the player package to the configured user:

1. First, navigate to the packages folder of the Stark-Server project.
  
  ```bash
  cd $STARK_HOME/packages
  ```

2. Clone or download the Stark-Player project.

  ```bash
  gh repo clone WeWatchWall/stark-player
  ```

3. Run the deployment script.

  ```bash
  cd stark-player/bin
  watch-deploy.cmd
  ```

4. This script will watch $STARK_HOME/packages/stark-player/dist until it is cancelled. Your prompt will return to $STARK_HOME.

## Usage

First, use the left menu to navigate to the Control panel.

You can upload a .zip file containing:

1. A .PLS file with Path, Title, Length for each track on the playlist.

2. An .MP3 file for each entry in the .PLS file.

Two example copyright-free playlists are included in the /example_playlists folder.
[![This link describes how to work with .PLS playlists.]](https://www.thewindowsclub.com/what-is-a-pls-file)

For best results, keep all the files in the root level of the .zip archive.

Once the playlist is loaded, central playback controls will appear below the file selector input. Press play.
Then, navigate to the Play panel. The user must press play at least once on the audio element on the Play panel to hear the playback on each browser window.
Sync can be controlled per browser instance.
