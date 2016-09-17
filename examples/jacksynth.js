//Promise = require('es6-promise').Promise
//var encoder = require('wav-file-stream')

var argv = require('minimist')(process.argv.slice(2))
var fs = require('fs')
var spawn = require('child_process').spawn

var path = require('path')

var jackConnector = require('../index.js');
var jackClientName = 'JACK connector - ' + new Date().getTime().toString();
jackConnector.openClientSync(jackClientName);
var sr = jackConnector.getSampleRateSync()

if(argv.r){
  var argz = ['./jackrec.js', '-r']
  if(argv.m) argz.push('-m')
  if(argv.o) {
    argz.push('-o')
    argz.push(argv.o)
  }
  argz.push('-c')
  argz.push(jackClientName)
  var rec = spawn('node', argz)
  rec.stdout.on('data', function(data){
    console.log(data.toString())
  })
}

module.exports = function(fn, mic){

  console.log('Opening JACK client...');
  console.log('Registering JACK ports...');


  var time = 0;
  var sampleCount = 0
  var sr = jackConnector.getSampleRateSync()
  var bufSize = jackConnector.getBufferSizeSync()
  console.log('sampleRate = %d', sr)
  console.log(bufSize)
  var ports = jackConnector.getAllPortsSync()
  var caps = ports.map(function(e){
    return e.match('capture') ? e : false
  }).filter(Boolean)
  console.log(caps)
  var wb = new Buffer(4)
  var _out = caps.reduce(function(a, e, i){
    var arr = new Array(bufSize)
    for(var x = 0; x < bufSize; x++){
      arr[x] = 0
    }
    a['out_' + (i + 1)] = arr 
    return a
  }, {})
  var cl = caps.length
  var input = new Array(caps.length)
  for(var y = 0; y < cl; y++) input[y] = 0 
  function audioProcess(err, nframes, capture) {
    if (err) {
      console.error(err);
      process.exit(1);
      return;
    }


    for(var x = 0; x < nframes; x++){
        Array.prototype.splice.apply(input, [0, cl].concat(input.map(function(e,i){return capture['in_'+ (i+1)][x]})))// capture.in_1[x], capture.in_2[x]])
        time = sampleCount / sr
        if(sampleCount === 0) console.log(input)
        fn(time, sampleCount, input)
        
        input.forEach(function(e,i){
          _out['out_' + (i+1)][x] = e //input[i] 
        })
        sampleCount++
    }
    
    return _out
    
  }

  console.log('Binding audio-process callback...');
  jackConnector.bindProcessSync(audioProcess);

  console.log('Activating JACK client...');
  jackConnector.activateSync();

  console.log('Auto-connecting to hardware ports...');
  caps.forEach(function(e,i){
    jackConnector.registerInPortSync('in_' + (i+1));
    jackConnector.registerOutPortSync('out_' + (i + 1));
    jackConnector.connectPortSync(e, jackClientName + ':in_' + (i+1));
    jackConnector.connectPortSync(jackClientName + ':out_' + (i+1), 'system:playback_' + (i+1));
  })  

  ;(function mainLoop() {
    console.log('Main loop is started.');
    setTimeout(mainLoop, 1000000000);
  })();

  process.on('SIGTERM', function () {
    console.log('Deactivating JACK client...');
    jackConnector.deactivateSync();
    console.log('Closing JACK client...');
    jackConnector.closeClient(function (err) {
      if (err) {
        console.error(err);
        process.exit(1);
        return;
      }

      console.log('Exiting...');
      process.exit(0);
    });
  });
}

module.exports.sampleRate = sr
