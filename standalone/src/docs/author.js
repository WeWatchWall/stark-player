export default {
  part1: `
    <ol>
    <li>This section describes the creation process for WWWall-compatible playlists. You can <a href="https://github.com/WeWatchWall/stark-player/blob/main/standalone/example_playlists/playlist.zip" target="_blank">download the example playlist here</a>.</li>
    <li>The playlist file is a .zip file with <strong>.mp3</strong> music files and a <strong>.pls</strong> file that describes their order and holds other metadata. <a href="https://www.thewindowsclub.com/what-is-a-pls-file" target="_blank">You can use this guide to get started on creating a .pls file</a>.</li>
    <li>Ensure that each item in the playlist has the following properties: FileN, TitleN, LengthN (in seconds) where N is the order index of the item.</li>
    <li>As is the case with the example playlist, manual synchronization can be specified by adding this line at the end of the playlist file:</li>
    </ol>
    <p><strong>StartTime=Dynamic</strong></p>
    <ol>
    <li value="5">The Dynamic tag means that the start time is at the next minute.</li>
    <li value="6">In order to set a fixed start time, please select the date and time below:</li>
    </ol>
  `,
  part2: `
    <ol>
    <li value="7">The .mp3 files should be optimized. A constant bitrate of 56 kbps is optimal and results in file sizes of 15MB/hour. It is not recommended to go over 50 MB or 3 hours playtime per file. Usually, a low bitrate means that volume should be amplified as much as possible(12 dB or 400%).</li>
    <li value="8">The playlist is almost done! All that's necessary is to zip all the .mp3 tracks and single .pls playlist file into the root level of the .zip archive.</li>
    <li value="9">Now, you can send out the playlist archive to your devices or event participants through email or host it on a website.&nbsp;</li>
    </ol>
  `
}