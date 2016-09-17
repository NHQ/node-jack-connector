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

  function audioProcess(err, nframes, capture) {
    if (err) {
      console.error(err);
      process.exit(1);
      return;
    }
    //var out = _out//{out_1: capture.in_1, out_2: capture.in_2}

    var input = []

    for(var x = 0; x < nframes; x++){
        input.splice(0, 2, capture.in_1[x], capture.in_2[x])
        time = sampleCount / sr
        fn(time, sampleCount, input)
        _out.out_1[x] = input[0]
        _out.out_2[x] = input[1]
        sampleCount++
    }
    
    return _out
    
  }

  console.log('Binding audio-process callback...');
  jackConnector.bindProcessSync(audioProcess);

  console.log('Activating JACK client...');
  jackConnector.activateSync();

  console.log('Auto-connecting to hardware ports...');
  console.log(ports)
  caps.forEach(function(e,i){
    console.log(e,i)
    jackConnector.registerInPortSync('in_' + (i+1));
    jackConnector.registerOutPortSync('out_' + (i + 1));
    jackConnector.connectPortSync(e, jackClientName + ':in_' + (i+1));
    jackConnector.connectPortSync(jackClientName + ':out_' + (i+1), 'system:playback_' + (i+1));
  })  
  //jackConnector.connectPortSync('system:capture_1', jackClientName + ':in_l');
//  jackConnector.connectPortSync('system:capture_2', jackClientName + ':in_r');
  //jackConnector.connectPortSync(jackClientName + ':out_l', 'system:playback_1');
  //jackConnector.connectPortSync(jackClientName + ':out_r', 'system:playback_2');

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
