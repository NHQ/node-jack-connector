var ms = [2,5,-3,4,1,-5,13,3,3,0,2,2,0]

return function (t) {
  var xt = t%8>5?2:8
  var tt = t%(1+sin(1)/xt)+0.5
  var m = ms[Math.floor(t*2)%ms.length]
  var xm = Math.pow(2,m/12)
  var a = sin_(2+sin_(sin(4),tt),tt)
    * sin(4) * sin(1/2) * sin(400) * 0.5
  var b = (0
      + saw(xm*80) + saw(xm*80.1)
    ) * sin(4) * 0.6
  var c = (0
    + saw(400+sin(1/4)/4) * 0.4
    + saw(400+sin(1/4)/4+0.25) * 0.4
    + saw(750+sin(1/4)/2-0.13) * 0.4
  )*(1-sin((t+2)%4>3?8:1))/2
  if (t % 32 > 24) return a*0.25 + b*0.25 + c
  return 0
    + a*0.5 + b*0.5
    + c*sin(400+xm*100)*sin(1) * 0.4

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