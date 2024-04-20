import clm from './clmtrackr/clmtrackr.module.js'
import {
  emotionClassifier,
  emotionModel,
} from './clmtrackr/emotion_classifier.js'
import * as d3 from 'd3'

const vid = document.getElementById('videoel')
const vid_height = vid.height
let vid_width = vid.width

const overlay = document.getElementById('overlay')
overlay.getContext('2d').willReadFrequently = true

function adjustVideoProportions() {
  // resize overlay and video if proportions are different
  // keep same height, just change width
  const proportion = vid.videoWidth / vid.videoHeight
  vid_width = Math.round(vid_height * proportion)
  vid.width = vid_width
  overlay.width = vid_width
}

function gumSuccess(stream) {
  // add camera stream if getUserMedia succeeded
  if ('srcObject' in vid) {
    vid.srcObject = stream
  } else {
    vid.src = window.URL && window.URL.createObjectURL(stream)
  }
  vid.onloadedmetadata = function () {
    adjustVideoProportions()
    vid.play()
  }
  vid.onresize = function () {
    adjustVideoProportions()
    if (trackingStarted) {
      ctrack.stop()
      ctrack.reset()
      ctrack.start(vid)
    }
  }
}

function gumFail() {
  alert(
    'There was some problem trying to fetch video from your webcam. If you have a webcam, please make sure to accept when the browser asks for access to your webcam.'
  )
}

let trackingStarted = false
const ctrack = new clm.tracker({ useWebGL: true })
ctrack.init(clm.pModel)

const eClassifier = new emotionClassifier()
eClassifier.init(emotionModel)
const emotionData = eClassifier.getBlank()

export const facialRecognition = {
  startVideo: (event) => {
    event.preventDefault()
    console.log('start video.')
    // start video
    // check for camerasupport
    if (navigator.mediaDevices) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then(gumSuccess)
        .catch(gumFail)
    } else if (navigator.getUserMedia) {
      navigator.getUserMedia({ video: true }, gumSuccess, gumFail)
    } else {
      alert(
        'This demo depends on getUserMedia, which your browser does not seem to support. :('
      )
    }
    vid.play()
    // start tracking
    ctrack.start(vid)
    trackingStarted = true
    // Show overlay
    overlay.style.display = 'block'
    // start loop to draw face
    drawLoop()
  },
  stopVideo: (event) => {
    event.preventDefault()
    // Stop video playback
    if (vid.srcObject) {
      vid.srcObject.getTracks().forEach((track) => track.stop())
    }
    // Stop tracking
    if (trackingStarted) {
      ctrack.stop()
      trackingStarted = false
      // Clear overlay
      overlay.style.display = 'none'
    }
  },
}

function drawLoop() {
  window.requestAnimationFrame(drawLoop)
  overlay.getContext('2d').clearRect(0, 0, vid_width, vid_height)
  if (ctrack.getCurrentPosition()) {
    ctrack.draw(overlay)
  }
  var cp = ctrack.getCurrentParameters()

  var er = eClassifier.meanPredict(cp)
  if (er) {
    updateData(er)
  }
}

const maxEmotionElement = document.getElementById('maxEmotion')
let pastEmotionValue = undefined
let emotionToSend = 'NOT_DETECTED'
let emotionDetectedUnixTime = Date.now()

export function getEmotionAndTime() {
  return { emotionToSend, emotionDetectedUnixTime }
}

function updateData(data) {
  // Find max emotion value
  const maxEmotion = data.reduce(function (prev, current) {
    return prev.value > current.value ? prev : current
  })

  // Update max emotion element
  maxEmotionElement.innerHTML =
    maxEmotion.value.toFixed(2) >= 0.2
      ? 'Current max emotion: ' +
        maxEmotion.emotion +
        ' (' +
        maxEmotion.value.toFixed(2) +
        ')'
      : 'No emotion is detected'

  // Output max emotion to console
  const currentEmotionValue = maxEmotion.value.toFixed(2)
  if (currentEmotionValue != pastEmotionValue) {
    if (currentEmotionValue >= 0.2) {
      console.log(
        `Current max emotion: ${maxEmotion.emotion} (${currentEmotionValue})`
      )
      emotionToSend = maxEmotion.emotion
      emotionDetectedUnixTime = Date.now()
    } else {
      console.log('-1')
    }
    pastEmotionValue = currentEmotionValue
  }

  // update
  const rects = svg
    .selectAll('rect')
    .data(data)
    .attr('y', function (datum) {
      return height - y(datum.value)
    })
    .attr('height', function (datum) {
      return y(datum.value)
    })
  const texts = svg
    .selectAll('text.labels')
    .data(data)
    .attr('y', function (datum) {
      return height - y(datum.value)
    })
    .text(function (datum) {
      return datum.value.toFixed(1)
    })

  // enter
  rects.enter().append('svg:rect')
  texts.enter().append('svg:text')

  // exit
  rects.exit().remove()
  texts.exit().remove()
}

/************ d3 code for barchart *****************/

const margin = { top: 20, right: 20, bottom: 10, left: 40 }
const width = 400 - margin.left - margin.right
const height = 100 - margin.top - margin.bottom
const barWidth = 30

const x = d3
  .scaleLinear()
  .domain([0, eClassifier.getEmotions().length])
  .range([margin.left, width + margin.left])
const y = d3.scaleLinear().domain([0, 1]).range([0, height])

const svg = d3
  .select('#emotion_chart')
  .append('svg')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom)
svg
  .selectAll('rect')
  .data(emotionData)
  .enter()
  .append('svg:rect')
  .attr('x', function (datum, index) {
    return x(index)
  })
  .attr('y', function (datum) {
    return height - y(datum.value)
  })
  .attr('height', function (datum) {
    return y(datum.value)
  })
  .attr('width', barWidth)
  .attr('fill', '#2d578b')
svg
  .selectAll('text.labels')
  .data(emotionData)
  .enter()
  .append('svg:text')
  .attr('x', function (datum, index) {
    return x(index) + barWidth
  })
  .attr('y', function (datum) {
    return height - y(datum.value)
  })
  .attr('dx', -barWidth / 2)
  .attr('dy', '1.2em')
  .attr('text-anchor', 'middle')
  .text(function (datum) {
    return datum.value
  })
  .attr('fill', 'white')
  .attr('class', 'labels')
svg
  .selectAll('text.yAxis')
  .data(emotionData)
  .enter()
  .append('svg:text')
  .attr('x', function (datum, index) {
    return x(index) + barWidth
  })
  .attr('y', height)
  .attr('dx', -barWidth / 2)
  .attr('text-anchor', 'middle')
  .attr('style', 'font-size: 12')
  .text(function (datum) {
    return datum.emotion
  })
  .attr('transform', 'translate(0, 18)')
  .attr('class', 'yAxis')
