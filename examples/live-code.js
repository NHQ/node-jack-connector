/*
i dont care where yr goin
i dont care where ta from
i dont care
how many times
your selfie been around the sun
tell me 'bout your being
what yr doin
what yr into
what yr about
*/

var $ui = function(o){return o}
var sampleRate = 48000

var st = $ui({
  bpm: 72,
  mfy: 6
})
var bpm = st.bpm
timer = $.zerone(bpm, sampleRate)
generator = new $.chrono()
generator2 = new $.chrono()

//console.log(timer, st)
//t0.emit('stop')
t1 = timer.beat(6/4 * 3/2/2, [,1,,1,,,,[,,,1],[,1],,,,[1,,,]], function(ti, b){
  if(b % 6 ===0)return
  var iir = $.iir(3)
  var amp = [[1,1],[0,1],[1,1], [0,0]]
  var dec = [[0,1],[0,0], [1,0]]
  var dur = [7/8]
  if(b % 2 === 0) dur[0] = 3/5 + Math.random() / 9
  var d = dur.reduce(function(a, e){ return a + e}, 0)
  var b = {}
  b.f = 111 / 2
  b.m = Math.PI / 2
  b.i = 5
  b.c = Math.sqrt(2)
  b.wave = 'square'
  var bass = $.meffisto(b)
  var synth = function(t){ t= t - ti
     bass.m = $.amod(Math.PI / 3, Math.PI / 6, t, 6/4/2/2/2/2/2/2)
     return iir(bass.ring(t) * $.amod(.667, .111, t, bass.f*$.amod(2, 1, t, bass.f*3))) / 2
  }
  generator.set(ti, synth, {curves: [amp], durations: dur})

})

var t12s = 1
var del = $.jdelay(Math.floor(sampleRate * st.bpm / 60 / 3 / 3), 1/3, 1)

t0 = timer.beat(3/4 * 3/2/2, [[1,,1,],[,1],1,1,[,,1,1],[,1],1,[,,1,1,],[,1,,1],1,[1,,,1],[,1,,[1,1,],[,1,],[,1,],[,1,],[,1,],[,1,],[,1,],[,1,]],[,1,,1],1,[1,,,1],[,,1,1]], function(ti, b, off, swing){
  var mfy = 1
  if(b%2 ===0) mfy = st.mfy
  var amp = [[1,0],[1,1],[0,1], [0,1]]
  var dec = [[0,1],[0,0], [1,0]]
  var dur = [3/64+Math.random()/24]//, 24/64/mfy+Math.random()/16]
  var d = dur.reduce(function(a, e){ return a + e}, 0)
  var iir = $.iir(2)
  var env = $.env([amp], dur)
  var o = {}
  o.c = Math.sqrt(2)/2
  o.m = 1/2
  o.i = 5
  o.f = b % 4 === 0 ? 333 * mfy : (333 / 2) * mfy
  o.wave = 'sine'
  if(b%16===0) {
    o.f = 333 * mfy
    o.wave = 'sine'
  }
  if(b%6===0){
     t12s = 1
  }

  if(b%4===0) {
    o.f = 333 * mfy * Math.pow(2, t12s++/12)
    o.wave = 'sine'
    if(b%3===2)t12s++
  }


  if(b%4 ===0) o.wave = 'sine'
  var buzz = $.meffisto(o)
  var synth = function(t, s, i){
    var tt = t
    t = t - ti// + 1007
    buzz.i = wmod_(14,2, t, buzz.f/3)
    buzz.m = 2.12 + amod_(0, 1/3/2/2/2, t, 3/4/2/2)
    var s = (buzz.ring(t, $.amod(0, Math.PI/3/3/3, t, buzz.f*2), Math.sqrt(4)/4))                 

    return (iir(s) / 2)
    function tri (x) { return tri_(x,t) }
    function tri_ (x,t) { return Math.abs(1 - t % (1/x) * x * 2) * 2 - 1 }
  
    function amod_(c, r, t, f){ return c + r * ((Math.log((1.0001 + sin(f, t)) * 50) / Math.log(10))/2-2) }
    function wmod_(c, r, t, f){ return c + Math.floor(r * ((Math.log((1.0001 + sin(f, t)) * 50) / Math.log(10))/2-2)) }
    function amod(c, r, f){ return c + r * ((Math.log((1.0001 + sin(f)) * 50) / Math.log(10))/2-2) }
    function sin (x) { return Math.sin(2 * Math.PI * t * x) }
    function sin_ (x, t) { return Math.sin(2 * Math.PI * t * x) }
  }
  generator2.set(ti, synth, {curves: [amp], durations: dur})
})

var music = function(t, s, i){
  timer.tick(t)
  return generator.tick(t, s, i) + (generator2.tick(t, s, i))
}

return function(t, s, i){

  return i + (music(t, s, i) )
}
