Promise = require('es6-promise').Promise
var argv = require('minimist')(process.argv.slice(2))
console.log(argv)
var fs = require('fs')
var decode = require('wav-decoder').decode
var convert = require('buffer-converter')
var resample = require('./resampler')
var sr = 48000 // redefined below #lazy

if(argv.i){
  fs.readFile(argv.i, function(e, data){
    data = convert.toArrayBuffer(data)
    decode(data).then(function(audio){
      if(!(audio.sampleRate === sr)){ 
        console.log(sr, audio.sampleRate, audio.channelData[0].length)
        audio.channelData = audio.channelData.map(function(e){
          var resampler = new resample(audio.sampleRate, sr, 1, e.length * sr / audio.sampleRate) 
          return resampler.resampler(e)
        })
      }
      dsp = function(t, i, s){
        return  audio.channelData[0][i % audio.channelData[0].length]
      }
      console.log(dsp)
    }).catch(console.log)


  })

}
var gaze = require('gaze')
XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest // yup
var eat = require('es666')

var fileIn = function(t, s){
  return 0
}

var dsp = function(t, s, i){
  return i
}

gaze('./live-code.js', function(err, watch){
  watch.on('changed', function(){
    fs.readFile('./live-code.js', 'utf8', function(err, code){
      console.log(code)
      try{
        
        eat(code, function(err, ret, fn){
          dsp = ret
          console.log(ret)
       //   if(ret) dsp = ret
        })
        //dsp = require('./live-code.js')
        //console.log(dsp)
      }
      catch(e){
        eat(code, function(err, ret, fn){
          if(ret) dsp = ret
        })
      }
    })
  })
})

var debounce = require('debounce')
sp = require('serialport')
SP = sp.SerialPort
port = new SP('/dev/ttyACM0')


var midi = require('midi')
var input = new midi.input()

input.openPort(1)

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
var map
if(argv._.length > 0) map = argv._.map(Number)
else map = [2,4,8] 

var delayos = []

var setDelays = function(){
  delayos = map.map(function(e, i){
     return jdelay(Math.max(1, Math.floor(spb * (e) * dmod)), (( 1 + i) / delayos.length) * fbmod, dmix)
  })
}

input.on('message', function(d, m){
  var data = m.toString().split(',')
  //console.log(data)
  console.log(data, d)
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
    
  var inp = i[0] + i[1]
  var exp = inp
  //inp += dsp(t, s, inp)
  //inp /= 3
  //var l = getLoops(inp)
  //i[0] = i[1] = getDelays(dsp(t, s))
  
  i[0] = i[1] = getDelays(inp)//dsp(t, s, i))//getDelays(dsp(t, s, i)) //+ l

}

jsynth(music)

port.on('open', function(){
  console.log('open')
})

var fns = [0,1,2,3].map(function(e){
  var v = null
  if(e === 0) v = 1
  return button(e, v)
})

port.on('data', function(data, x){
  var data = data.toString().split(',')
  if(!isNaN(data[0]))  fns[data[0]](parseInt(data[1]))

})

function button(i, v){
  return debounce(function(data){
    console.log(data)
    switch(i){
      case 0:
        // start / stop loop 
        if(recording){
        
          var delay = jdelay(loop.length, 1, 1)
          loop.forEach(delay)
          loops.push(delay)
          loop = []
          recording = false

        }
        else{
          recording = true
        }

      break
      case 1:
        pressMods['pedal1'] = !pressMods['pedal1']
        console.log('hobble mode = %s', !pressMods['pedal1'])
        // what
      break
      case 2:
        //  override delays
        mix = !mix
        console.log('passthrough mode = %s', mix)
      break
      case 3:
        //  clear delays
        setDelays(data/18500)
      break
    }
    //console.log(i, data)
  }, v || 100, true)
}

//var jsynth = require('./jacksynth')
//var sr = jsynth.sampleRate
