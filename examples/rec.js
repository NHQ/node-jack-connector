Promise = require('es6-promise').Promise
var argv = require('minimist')(process.argv.slice(2))
var spawn = require('child_process').spawn

var fs = require('fs')
var decode = require('wav-decoder').decode
var convert = require('buffer-converter')
var resample = require('./resampler')
var path = require('path')
var sr = 48000 // #lazy
if(argv.i){

  var ext = path.extname(argv.i)
  if(ext === '.mono'){
    fs.readFile(argv.i, function(e, data){
      if(e) console.log(e)

      var _sr = argv.i.split('.') 
      _sr = parseInt(_sr[_sr.length - 2])
      data = new Float32Array(convert.toArrayBuffer(data))
      console.log(data.length)
      

      if(false){  //\#lazy
        var resampler = new resample(_sr, sr, 1, data.length * sr / _sr) 
        resampler.resampler(data)
      }

      dsp = function(t, i, s){
        return  data[i % data.length]
      }
      

    })
  } 
  else{
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


var jsynth =  require('./jacksynth') 

var sr = jsynth.sampleRate
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
  //inp = dsp(t, s, inp)
  //inp /= 3
  //var l = getLoops(inp)
  //i[0] = i[1] = getDelays(dsp(t, s))
  
  i[0] = i[1] = dsp(t, s, inp) //getDelays(inp)//dsp(t, s, i))//getDelays(dsp(t, s, i)) //+ l

}

jsynth(music)

