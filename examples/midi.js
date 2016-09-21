Promise = require('es6-promise').Promise
var $ = require('../../../polysynth/cheatcode')

var argv = require('minimist')(process.argv.slice(2))
var fs = require('fs')
var script = fs.readFileSync('./keys.js', 'utf8')
var decode = require('wav-decoder').decode
var convert = require('buffer-converter')
var resample = require('./resampler')
var sr = 48000 // redefined below #lazy

var dsp = function(t, s, i){
  return i
}
var live = dsp

var gaze = require('gaze')

XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest // yup

gaze('./keys.js', function(err, watch){
  watch.on('changed', function(){
    fs.readFile('./keys.js', 'utf8', function(err, code){
      keys = new Function(['generator', '$'], code)(generator, $)
    })
  })
})

gaze('./live-code.js', function(err, watch){
  watch.on('changed', function(){
    fs.readFile('./live-code.js', 'utf8', function(err, code){
      live = new Function([ '$'], code)( $)
    })
  })
})

var midi = require('midi')
var input = new midi.input()

//input.openPort(1)

var jsynth = require('./jacksynth')
sr = jsynth.sampleRate
var jdelay = require('jdelay')
var bpm =  argv.bpm || 151
var secpb = bpm / 60
var spb = sr * 60 / bpm 
var dmod = argv.d || 1 //Math.PI / 4
var dmodifier = 1/10
var dmix = argv.m || 1
var pressMods = {}
pressMods.pedal1 = false
var durr = 3
var fbmod =  argv.f || 1
var time = 0
var map
if(argv._.length > 0) map = argv._.map(Number)
else map = [2,4,8] 

var delayos = []

var timer = $.jsync(bpm, sr)
var generator = new $.chrono()

var setDelays = function(){
  delayos = map.map(function(e, i){
     return jdelay(Math.max(1, Math.floor(spb * (e) * dmod)), (( 1 + i) / delayos.length) * fbmod, dmix)
  })

}
var keys = new Function(['generator', '$'], script)(generator, $)
input.on('message', function(d, m){
  var data = m.toString().split(',')
  //console.log(data)
  keys(time, data)
  if(data[0] === '176'){
    if(data[1].match('67')){
      pressMods[data[1]] = data[2] === '127' ? true : false    
      console.log(pressMods)
      return
    }
     
    switch(data[1]){
      case '1':
        if(pressMods['67']){
          map[0] += data[2] === '127' ? -.01 : .01
          console.log('map[0] = %d', map[0])
        }
        else {
          fbmod += Number(data[2]) > 2 ? -.005 : .005
          console.log('fbmod = %d', fbmod)
        }
      break
      case '2':
        if(pressMods['67']){
          map[1] += data[2] === '127' ? -.01 : .01
          console.log('map[1] = %d', map[1])
        }
        else{
          var isd = dmod <= 2
          var mod
          if(isd) {
            mod = .005 
            dmod += Number(data[2]) > 2 ? -mod : mod
          }
          else{
            dmod += Number(data[2]) > 2 ? -dmodifier : dmodifier
          }
          console.log('delay beat mod = %d', dmod)
        }
      break
      case '3':
        if(pressMods['67']){
          map[2] += data[2] === '127' ? -.1 : .1
          console.log('map[2] = %d', map[2])
        }
        else{
          bpm += Number(data[2]) > 2 ? -.1 : .1
          secpb = bpm / 60
          spb = sr * 60 / bpm 
          console.log('bpm = %d', bpm)
        }
      break
      case '4':
        dmix += Number(data[2]) > 2 ? -0.01 : 0.01
        console.log('dmix = %d', dmix)
      break
    }
  }
})


setDelays()

var mix = true
function getDelays(i){
  if(mix){
    if(pressMods['pedal1']){
      return   ( i + delayos.reduce(function(a, delay, y){
        return    (a + (delay(i, Math.floor(spb * (map[y]) * dmod),  ((1 + y) / delayos.length) * fbmod, dmix)))  // delayos.length 
      }, i) ) / 2 
    }
    else{
      return   (i + delayos.reduce(function(a, delay, y){
        return    i + (delay(a, Math.floor(spb * (map[y]) * dmod),  ((1 + y) / delayos.length) * fbmod, dmix)) // delayos.length 
      }, i) ) / 2
    }
  }
  else{
    return  ( i + delayos.reduce(function(a, delay, y){
      return    a + (delay(0, Math.floor(spb * (map[y]) * dmod), ((1 + y) / delayos.length) * fbmod,  dmix)) / 2// delayos.length 
    }, 0) )
  }
}

var loops = []
var loop = []
var recording = false

function getLoops(inp){
  if(recording){
    loop.push(inp)
  }
  if(loops.length > 0){
    return loops.reduce(function(a, delay){
      return delay(a, delay.length, 1, 1)
    }, 0) / loops.length
  }
  else return 0
}

var music = function(t, s, i){
  time = t
  timer.tick.call(timer, t)
  var ii = i[0] + i[1]
  // exluding line-in
  i[0] = i[1] = (live(t, s, generator.tick(t, s, i))) / 2

  //var xdsp = dsp(t, s, inp)
  //inp += dsp
  //inp /= 3
  //var l = getLoops(inp)
  //i[0] = i[1] = getDelays(dsp(t, s))
  
  //i[0] = i[1] =0// getDelays(inp) //+ (dsp(t,s, inp) * .25)//+ dsp(t, s, i)//dsp(t, s, i))//getDelays(dsp(t, s, i)) //+ l

}

jsynth(music)
var fns = [0,1,2,3].map(function(e){
  var v = null
  if(e === 0) v = 1
  return false//button(e, v)
})
