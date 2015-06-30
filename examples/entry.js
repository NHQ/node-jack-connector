var debounce = require('debounce')
sp = require('serialport')
SP = sp.SerialPort
port = new SP('/dev/ttyACM0')


//var midi = require('midi')
//var input = new midi.input()
//input.openPort(1) // probably

//input.on('message', function(m){
//console.log(m.oString())
//})
var jsynth = require('./jacksynth')
var sr = jsynth.sampleRate
var jdelay = require('jdelay')
var bpm =  115
var secpb = bpm / 60
var spb = sr * 60 / bpm 

console.log('spb %d', spb)
var map = [ 2, 4]

var delayos = []

var setDelays = function(){
  delayos = map.map(function(e, i){
     return jdelay(Math.floor(spb * e  * 2), e / (delayos.length * 4), (e / delayos.length * 4), i / map.length)
  })
}

setDelays()

var mix = true
function getDelays(i){
  if(mix){
    return   ( i + delayos.reduce(function(a, delay, y){
      return  (delay(a, Math.floor(spb * map[y] * 2), map[y] / (delayos.length * 4), 1 - y / delayos.length)) // delayos.length 
    }, i) ) 
  }
  else{
    return  ( i + delayos.reduce(function(a, delay, y){
      return  a + (delay(0, Math.floor(spb * map[y] * 2), 1,  1 - y / delayos.length)) // delayos.length 
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
        // what
      break
      case 2:
        //  override delays
        mix = !mix
      console.log(mix)
      break
      case 3:
        //  clear delays
        setDelays()
      break
    }
    console.log(i, data)
  }, 100, true)
}

var jsynth = require('./jacksynth')
var sr = jsynth.sampleRate
