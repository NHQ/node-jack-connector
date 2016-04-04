
var pitch = 64
var notesOn = {}

  return function(ti, ev){
    if(ev[0] === '224'){
      pitch = parseInt(ev[2])
    }
    if(ev[0] === '144'){
      var iir = $.iir(11,2)

      var fq = $.teoria.note.fromMIDI(ev[1]).fq()

      var tc = [[0,0],[0,1], [1, .787]]
      var td = [1/Math.log(fq)/2/2]
      var d = td[0]
      var tembre = $.env([tc], td)

      var p = {}
      p.c = Math.PI / 1
      p.m =  8 / 4 
      p.i =11
      p.f = fq 
      p.wave = 'triangle'
      var bell = $.meffisto(p)
      var start = ti
      var del = $.jdelay(48000 / 4, .5, 1)
      var synth = function(t, s, i){
        var dv = t < start + d 
        bell.m = $.amod(3/2/2, 3/2/2/2/2, (t - ti) + 20 , 3/2/12/2/2/2/2/2/2/2)

        env = dv ? tembre(t % d) : $.amod(.67, .34, t, Math.pow(2, Math.log(fq)))//$.amod(Math.log(fq), Math.log(fq / 2), t, 1/Math.log(fq) )) 
        return iir(bell.ring(t, $.amod(0, 1/12, t, bell.f), $.amod(Math.sqrt(2), Math.PI / 8, t, Math.log(fq))) * env || $.amod(.787, .3875, t, 144/60*8)) 
      }
console.log(start, ti + d)
var melody = [ 3, 1, 3, 2, 8 ]
var rhythm = [ 4, 3, 1, 2, 5 ]

var sss = function (t) {
        var dv = t < start + d 
        env = dv ? tembre(t % d) : $.amod(.787, .114, t,  $.amod(1/Math.log(fq), 1/64/2, t, Math.log(fq)))//1/$.amod(Math.log(fq), Math.log(fq) / 12, t,fq *2 )) 
    var m = fq//Math.pow(2,melody[Math.floor(t*8)%melody.length]/12)
      var n = fq//Math.pow(2,melody[Math.floor(t)%melody.length]/12)
        var r0 = rhythm[Math.floor(t*2)%rhythm.length]
          var r1 = rhythm[Math.floor(t)%rhythm.length]
            var d0 = (1-saw(r0))/2
              var d1 = (1-saw(r1*2))/2
        bell.wave = dv ? 'saw' : 'triangle'
        var b = bell.ring(t, $.amod(0, 1/2, t, 1/Math.log(fq)), $.amod(Math.sqrt(4), Math.PI / 8, t, Math.log(fq))) * env || $.amod(.75, .25, t, 4) 
                return (env * b) + 0 * (0
                    + clamp(sin_(tri_(sin(50*m)/8/4,t/2%1+20),t%1/4+.5)*8*4)
                          * d0*d0*d0 * 0.5
                              + tri_(tri_(tri(25*m)/2,t%1/8/2+40),t%1/4+80)
                                    * d1*d1*d1*d1 * 0.5
                                        + clamp(saw_(m*100+tri(400)/2,t%1/4+101)*d1*d1*d1*4)*0.3
                                            + saw_(m*800+sin(r1)/2,t%1/4+1)*d1*0.5)

                                              function tri_ (x,t) { return Math.abs(1 - t % (1/x) * x * 2) * 2 - 1 }
                                                function tri (x) { return tri_(x,t) }
                                                  function saw_ (x,t) { return t%(1/x)*x*2-1 }
                                                    function saw (x) { return saw_(x,t) }
                                                      function sin_ (x,t) { return Math.sin(2 * Math.PI * t * x) }
                                                        function sin (x) { return sin_(x,t) }
                                                          function sq_ (x,t) { return t*x % 1 < 0.5 ? -1 : 1 }
                                                            function sq (x) { return sq_(x,t) }
                                                              function clamp (x) { return Math.max(-1,Math.min(1,x)) }
                                                              }

      var gen = generator.set(ti, synth, Infinity)
      notesOn[ev[1]] = gen
      
    }
    if(ev[0] === '128'){
      if(notesOn[ev[1]]) notesOn[ev[1]].dur = 0
    }
    
  }

