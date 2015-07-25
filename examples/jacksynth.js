var jackConnector = require('../index.js');
var jackClientName = 'JACK connector - forwarding capture to playback example';
jackConnector.openClientSync(jackClientName);
var sr = jackConnector.getSampleRateSync()

module.exports = function(fn, mic){

  console.log('Opening JACK client...');
  console.log('Registering JACK ports...');

  jackConnector.registerInPortSync('in_l');
  jackConnector.registerInPortSync('in_r');
  jackConnector.registerOutPortSync('out_l');
  jackConnector.registerOutPortSync('out_r');

  var time = 0;
  var sampleCount = 0
  var sr = jackConnector.getSampleRateSync()
  console.log('sampleRate = %d', sr)

  function audioProcess(err, nframes, capture) {
    if (err) {
      console.error(err);
      process.exit(1);
      return;
    }
    var out = {out_l: capture.in_l, out_r: capture.in_r}


    var input = []

    for(var x = 0; x < nframes; x++){
        input.splice(0, 2, capture.in_l[x], capture.in_r[x])
        time = sampleCount / sr
        fn(time, sampleCount, input)
        out.out_l[x] = input[0]
        out.out_r[x] = input[1]
        sampleCount++
    }
    
    var _out = {
      out_l: capture.in_l,
      out_r: capture.in_r,
    };
    return out
    return _out
    
  }

  console.log('Binding audio-process callback...');
  jackConnector.bindProcessSync(audioProcess);

  console.log('Activating JACK client...');
  jackConnector.activateSync();

  console.log('Auto-connecting to hardware ports...');
  jackConnector.connectPortSync('system:capture_1', jackClientName + ':in_l');
  jackConnector.connectPortSync('system:capture_2', jackClientName + ':in_r');
  jackConnector.connectPortSync(jackClientName + ':out_l', 'system:playback_1');
  jackConnector.connectPortSync(jackClientName + ':out_r', 'system:playback_2');

  (function mainLoop() {
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
