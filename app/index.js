'use strict';
import './style.scss';
import extractPeaks from 'webaudio-peaks'
import GraphEQ from './graph.js'
import Recorder from 'recorderjs'
import { guess, analyze } from 'web-audio-beat-detector'

// How to hack an equalizer with two biquad filters
//
// 1. Extract the low frequencies (highshelf)
// 2. Extract the high frequencies (lowshelf)
// 3. Subtract low and high frequencies (add invert) from the source for the mid frequencies.
// 4. Add everything back together
//
// andre.michelle@gmail.com

if (navigator.mediaDevices) {

  navigator.mediaDevices.getUserMedia({audio: true}).then( stream => {
    var context = new AudioContext();
    var mediaElement = document.getElementById('player');
    var sourceNode = context.createMediaStreamSource(stream)//context.createMediaElementSource(mediaElement);

    // EQ Properties
    //
    var gainDb = -40.0;
    var bandSplit = [360,3600];

    var hBand = context.createBiquadFilter();
    hBand.type = "lowshelf";
    hBand.frequency.value = bandSplit[0];
    hBand.gain.value = gainDb;

    var hInvert = context.createGain();
    hInvert.gain.value = -1.0;

    var mBand = context.createGain();

    var lBand = context.createBiquadFilter();
    lBand.type = "highshelf";
    lBand.frequency.value = bandSplit[1];
    lBand.gain.value = gainDb;

    var lInvert = context.createGain();
    lInvert.gain.value = -1.0;

    sourceNode.connect(lBand);
    sourceNode.connect(mBand);
    sourceNode.connect(hBand);

    hBand.connect(hInvert);
    lBand.connect(lInvert);

    hInvert.connect(mBand);
    lInvert.connect(mBand);

    var lGain = context.createGain();
    var mGain = context.createGain();
    var hGain = context.createGain();

    lBand.connect(lGain);
    mBand.connect(mGain);
    hBand.connect(hGain);

    var sum = context.createGain();
    lGain.connect(sum);
    mGain.connect(sum);
    hGain.connect(sum);

    const graphEq = new GraphEQ(document.getElementById('graph'), context)

    mediaElement.addEventListener('canplay', evt => {
      graphEq.connectSource(sum)
      graphEq.connectDestination(context.destination)
      sum.connect(context.destination);
      mediaElement.play()
      graphEq.start()
    })


    // Extract try
    const rec = new Recorder(sum)

    // console.log(sourceNode)
    // console.log(extractPeaks(sum, 1000, true))
    // Input
    //
    function changeGain(evt)
    {
      var value = parseFloat(evt.target.value) / 100.0;
      const type = evt.target.id
      console.log(value, type)
      switch(type)
      {
        case 'lowgain': lGain.gain.value = value; break;
        case 'midgain': mGain.gain.value = value; break;
        case 'highgain': hGain.gain.value = value; break;
      }
    }

    const lowGainSlider = document.getElementById('lowgain')
    const midGainSlider = document.getElementById('midgain')
    const highGainSlider = document.getElementById('highgain')

    lowGainSlider.addEventListener("input", changeGain)
    midGainSlider.addEventListener("input", changeGain)
    highGainSlider.addEventListener("input", changeGain)

    const recordButton = document.getElementById('record')
    const stopButton = document.getElementById('stop')
    recordButton.addEventListener('click', evt => {
      rec.record()
    })
    stopButton.addEventListener('click', evt => {
      rec.stop()
      rec.getBuffer( buffers => {
        const newBuffer = context.createBuffer( 2, buffers[0].length, context.sampleRate )
        newBuffer.copyToChannel(buffers[0], 0)
        newBuffer.copyToChannel(buffers[1], 1)
        console.log(newBuffer, buffers)
        // console.log(extractPeaks(newBuffer, 2048))
        analyze(newBuffer)
          .then(({ bpm, offset }) => {
            console.log(bpm, offset)
              // the bpm and offset could be guessed
          })
          .catch((err) => {
            console.log(err)
              // something went wrong
          });
      })
    })
  })
}
