notesOn = {} 
return keys

function keys(ti, ev){ 
    if(ev[0] === '224'){
      pitch = parseInt(ev[2])
    }
    if(ev[0] === '144'){
      var iir = $.iir(5,3)

      var fq = $.teoria.note.fromMIDI(ev[1]).fq()

      var tc = [[0,0],[0,1], [1, .787]]
      var tr = [[0,.787],[0,1], [1, .67]]
      var td = [1/32, 16/32]
      var d = td[0] = td[1]
      var tembre = $.env([tc, tr], td)

      var p = {}
      p.c = Math.PI / 7
      p.m =  8 / 4 
      p.i  = 12
      p.f = fq 
      p.wave = 'square'
      var bell = $.meffisto(p)
      var start = ti 
      var del = $.jdelay(48000 / 4, .5, 1)
      var synth = function(t, s, i){  //t = t - ti + 12
        var dv = t < start + d 
        bell.m = $.amod(2, 3/2/2, t , -3/2/3/3/3/3)
        var ii = $.sigmod(0, 3, t + 1/4, 8)
        env = dv ? tembre(t % d) : $.amod(.67, .3, t, bell.f/3)//$.amod(Math.log(fq), Math.log(fq / 2), t, 1/Math.log(fq) )) 
        return iir(bell.ring(t, ii) ) 
      }

      var gen = generator.set(ti, synth, Infinity)
      notesOn[ev[1]] = gen 
      // console.log(notesOn)  
    } 
    if(ev[0] === '128'){ //console.log(ev[1])
      if(notesOn[ev[1]]) notesOn[ev[1]].dur = 0
    }
    
  }
 
