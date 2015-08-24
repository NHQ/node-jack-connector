
var osc = require('oscillators')
var amod = require('amod')

var x = 2
var ttt = false
return specialX


function dsp(t){
  var bpm = 144 / 60
  t *= bpm
 //return osc.square(t, 442 * Math.pow(2, 3/12) * osc.sine(t,  ))
}

function specialX(t){
  //t *= 144 / 60
  if(t > 12 * x) x+=4   
  if(!ttt) ttt = t
  //t -= ttt || 0
  t *= 72 / 60 * x  
  t = t * (5) % 12 % t
  var a = 1//amod(.85, .15, t, 3)
  return 0
    + osc.sine(t, 120 + osc.triangle(t, amod(.5, .21, t, 1/4) * osc.triangle(t, 2))) * a
    + osc.sine(t, 360 + (amod(.5, .21, t, 1/6) * osc.triangle(t, 3))) * a
} 
