var debounce = require('debounce')
sp = require('serialport')
SP = sp.SerialPort
port = new SP('/dev/ttyACM0')
var midi = require('midi')
var input = new midi.input()

input.openPort(1)

var jsynth = require('./jacksynth')
var sr = jsynth.sampleRate
var jdelay = require('jdelay')
var bpm =  151
var secpb = bpm / 60
var spb = sr * 60 / bpm 
var dmod = 1//Math.PI / 4
var dmodifier = 1/4
var dmix = 1
var pressMods = {}
pressMods.pedal1 = false
var durr = 3
var fbmod =  1
var map = [ 2, 4, 8]

var delayos = []

var setDelays = function(){
  delayos = map.map(function(e, i){
     return jdelay(Math.floor(spb * (e) * dmod), (( 1 + i) / delayos.length) * fbmod, dmix)
  })
}

input.on('message', function(d, m){
  var data = m.toString().split(',')
  //console.log(data)
  if(data[0] === '176'){
    if(data[1].match('67')){
      pressMods[data[1]] = data[2] === '127' ? true : false    
      console.log(pressMods)
      return
    }
     
    switch(data[1]){
      case '1':
        if(pressMods['67']){
          map[0] += data[2] === '127' ? -.1 : .1
          console.log('map[0] = %d', map[0])
        }
        else {
          fbmod += Number(data[2]) > 2 ? -.01 : .01
          console.log('fbmod = %d', fbmod)
        }
      break
      case '2':
        if(pressMods['67']){
          map[1] += data[2] === '127' ? -.1 : .1
          console.log('map[1] = %d', map[1])
        }
        else{
          var isd = dmod <= 2
          var mod
          if(isd) {
            mod = .01 
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
          bpm += Number(data[2]) > 2 ? -1 : 1
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
        return    a + (delay(i, Math.floor(spb * (map[y]) * dmod),  ((1 + y) / delayos.length) * fbmod, dmix)) / 2 // delayos.length 
      }, 0) ) 
    }
    else{
      return   ( i + delayos.reduce(function(a, delay, y){
        return    (delay(a, Math.floor(spb * (map[y]) * dmod),  ((1 + y) / delayos.length) * fbmod, dmix)) / 2 // delayos.length 
      }, i) )
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
  inp /= 2
  //var l = getLoops(inp)
  i[0] = i[1] = getDelays(inp) //+ l

}

jsynth(music)

port.on('open', function(){
  console.log('open')
})

var fns = [0,1,2,3].map(function(e){
  return button(e)
})

port.on('data', function(data, x){
  var data = data.toString().split(',')
  if(!isNaN(data[0]))  fns[data[0]](parseInt(data[1]))

})

function button(i){
  return debounce(function(data){
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
        console.log('playover mode = %s', mix)
      break
      case 3:
        //  clear delays
        setDelays()
      break
    }
    //console.log(i, data)
  }, 100, true)
}

var jsynth = require('./jacksynth')
var sr = jsynth.sampleRate
