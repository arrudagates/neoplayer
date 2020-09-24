var blessed = require('neo-blessed')
const yts = require('yt-search')
const mpvAPI = require('node-mpv');
const client = require('discord-rich-presence')('704314970522910730');
const clipboardy = require('clipboardy');
//const jsonpath = require("jsonpath/jsonpath.min")

client.on("error", () => {});

const mpv = new mpvAPI({
  "audio_only": true,
  //"binary": __dirname + "/mpv.exe",
});

async function start(){
  try{
  await mpv.start().then(screen.render())
  await mpv.volume(70);
}
catch (error) {
  console.log(error);
  }
}

var screen = blessed.screen({
  smartCSR: true,
  dockBorders: true,
  //autoPadding: true
});

var form = blessed.form({
  parent: screen,
  width: '100%',
  left: 'center',
  keys: true,
  focused: true
});

var input = blessed.textbox({
  parent: form,
  left: 0,
  bottom: 0,
  height: 3,//'15%',
  width: '100%',
  border: 'line',
  label: ' input ',
  input: true,
  inputOnFocus: false,
  focused: true
});

var list = blessed.list({
  parent: screen,
  interactive: false,
  top: 'center',
  width: '100%',
  height: screen.height - 7,//'70%',
  keys: true,
  border: 'line',
  scrollbar: {
    ch: ' ',
    track: {
      bg: 'cyan'
    },
    style: {
      inverse: true
    }
  },
  style: {
    item: {
      hover: {
        bg: 'blue'
      }
    },
    selected: {
      bg: 'blue',
      bold: true
    }
  }
});

screen.on('resize', function(){list.height = screen.height - 7})

var top = blessed.text({
  parent: screen,
  top: 0,
  height: 3,//'15%',
  width: '100%',
  border: 'line',
  label: ' Now Playing ',
  content: 'Nothing'
});

// var bar = blessed.progressbar({
//   parent: screen,
//   top: 3,
//   height: 2,//'15%',
//   width: '100%',
//   border: 'line',
//   pch: '-',
// });


screen.key('h', function() {
  input.readInput()
});

screen.key('r', function() {
});

screen.key('S-s', function() {
});

screen.key('s', function() {

});

screen.key('esc', function() {
});

start()


mpv.on("started", async () => {
  let np = await mpv.getTitle()
  let remaining = await mpv.getTimeRemaining()
  top.setContent(np)
  screen.render()

  try{
  client.updatePresence({
  state: np,
  details: 'Playing:',
  startTimestamp: Date.now(),
  endTimestamp: Date.now() + (remaining * 1000),
  largeImageKey: 'neoplayer',
  smallImageKey: 'play-circle',
  instance: true,
    });
  }
  catch{}

  // var timer = setInterval(async function () {
  //   progress = await mpv.getPercentPosition()
  //   await bar.setProgress(progress)
  //   await screen.render()
  // }, 100);

})
mpv.on("paused", async () => {
  let np = await mpv.getTitle()
  top.setLabel(' Paused ')
  screen.render()

  try{
  client.updatePresence({
  state: np,
  details: 'Paused',
  largeImageKey: 'neoplayer',
  smallImageKey: 'pause-circle',
  instance: true,
    });
  }
  catch{}
})
mpv.on("resumed", async () => {
  let np = await mpv.getTitle()
  let remaining = await mpv.getTimeRemaining()
  top.setLabel(' Now Playing ')
  screen.render()

  try{
  client.updatePresence({
  state: np,
  details: 'Playing:',
  startTimestamp: Date.now(),
  endTimestamp: Date.now() + (remaining * 1000),
  largeImageKey: 'neoplayer',
  smallImageKey: 'play-circle',
  instance: true,
    });
  }
  catch{}
});

mpv.on("stopped", async () => {
  top.setContent(' Nothing ')
  screen.render()

  try{
  client.updatePresence({
  state: 'Nothing',
  details: 'Playing:',
  largeImageKey: 'neoplayer',
  smallImageKey: 'stop-circle',
  instance: true,
    });
  }
  catch{}
});


let results = []
let urls = []

async function search(arg){
urls = []
results = []
const r = await yts(arg)

const videos = r.videos.slice( 0, list.height - 2 )
for (let i in videos){
    results.push (i + " - " + videos[i].title)
    // list.add(i + " - " + videos[i].title)
    urls.push(videos[i].url)
  }
await list.setItems(results)

await screen.render()
}

async function play(arg){
  try{
  await mpv.load(arg, mode="append-play")
  }
catch (error) {
  console.log(error);
  }
}

async function pause(){
  try{
    await mpv.togglePause()
  }
  catch (error){}
}

async function skip(){
  try{
    await mpv.next(mode="force")
  }
  catch (error){}
}

async function volume(arg){
  try{
    await mpv.volume(arg)
  }
  catch (error){}
}

async function link(){
  try{
    let link = await mpv.getFilename(mode="full")
    await clipboardy.writeSync(link);
  }
  catch (error){}
}

input.on('submit', function(){
  let arg = input.value.split(' ')
  switch (arg[0]){
    case 'q':
      mpv.quit()
      return process.exit(0);
      break;
    case 'search':
      search(input.value.slice(7))
      break;
    case 'play':
      play(urls[input.value.slice(5)])
      break;
    case 'pause':
      pause()
      break;
    case 'skip':
      skip()
      break;
    case 'volume':
      volume(input.value.slice(7))
      break;
    case 'link':
      link()
      break;
    // case 'url':
    //   play(input.value.slice(4))
    //   break
  }
  input.clearValue()
  screen.render()
})
