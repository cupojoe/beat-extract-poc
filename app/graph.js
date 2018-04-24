import extractPeaks from 'webaudio-peaks'

export default class GraphicEQ {
  constructor(canvasEl, audioContext) {
    this.analyser = audioContext.createAnalyser()
    this.analyser.fftSize = 64
    this.analyser.smoothingTimeConstant = 0
    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount)
    this.graph = canvasEl.getContext('2d')
    this.width = this.graph.canvas.width
    this.height = this.graph.canvas.height
    this.barSpacing = this.width / this.analyser.frequencyBinCount
    this.requestId = -1
    this.threshold = 0
  }

  update = () => {
    this.requestId = window.requestAnimationFrame(this.update);

    this.analyser.getByteFrequencyData(this.frequencyData);

    this.graph.clearRect(0, 0, this.width, this.height)
    const t = this.threshold
    this.frequencyData.forEach((freq, index) => {
      if (freq > t) {
        this.graph.fillRect(index * this.barSpacing, 0, this.barSpacing/1.25, freq)
      }
    })
  }

  start = () => {
    this.update()
  }

  stop = () => {
    window.cancelAnimationFrame(this.requestId)
    this.graph.clearRect(0, 0, this.width, this.height)
  }

  connectSource = source => {
    source.connect(this.analyser)
  }

  connectDestination = destination => {
    this.analyser.connect(destination)
  }
}
