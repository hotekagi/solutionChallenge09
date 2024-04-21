import {
  webrtcActions,
  handleDevicesChanged,
  isRoomConnected,
} from './webrtcActions.js'
import {
  getRoomName,
  sendChat,
  changeChapter,
  editChapter,
  getCurrentChapter,
  reloadChapterList,
  sendCurrentChapter,
} from './chatActions.js'
import { hostname } from './hostname.js'

handleDevicesChanged()
setTimeout(handleDevicesChanged, 100)
reloadChapterList()
setTimeout(reloadChapterList, 1000)

window.webrtcActions = webrtcActions
window.sendChat = sendChat
window.changeChapter = changeChapter
window.editChapter = editChapter

const form = document.getElementById('pdf-upload-form')
form.addEventListener('submit', function (e) {
  e.preventDefault()

  var formData = new FormData(this)

  fetch(`http://${hostname}:8880/pdf-summary`, {
    method: 'POST',
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data)
      document.querySelector('#pdf-upload-form input[type="file"]').value = ''
    })
    .catch((error) => {
      console.error('Error:', error)
    })
})

let stopwatch = undefined
let seconds = 0
let minutes = 0
let hours = 0

function pad(value) {
  return value < 10 ? '0' + value : value
}

function updateStopwatch() {
  seconds++
  if (seconds === 60) {
    seconds = 0
    minutes++
    if (minutes === 60) {
      minutes = 0
      hours++
    }
  }

  const formattedTime = pad(hours) + ':' + pad(minutes) + ':' + pad(seconds)
  document.getElementById('recordingStatus').textContent =
    'Recording... ' + formattedTime
}

let mediaRecorder = undefined
let recordedChunks = []
let isRecording = false

const startRecording = () => {
  if (isRecording) {
    return
  }

  if (!isRoomConnected()) {
    alert(
      'To start recording, you must be connected to the room. ' +
        '(If you are already connected, please wait a little while for the connection to stabilize and try again)'
    )
    return
  }

  navigator.mediaDevices
    .getUserMedia({ video: true, audio: true })
    .then((stream) => {
      mediaRecorder = new MediaRecorder(stream)
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data)
        }
      }
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' })
        const timestamp = new Date()
          .toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })
          .replaceAll('/', '')
          .replace(' ', '')
          .replace(':', '')
        const filename = `${getRoomName()}-${getCurrentChapter()}-${timestamp}.webm`
        const formData = new FormData()
        formData.append('file', blob, filename)
        formData.append('filename', filename)

        fetch(`http://${hostname}:8880/upload`, {
          method: 'POST',
          body: formData,
        })
          .then((response) => response.json())
          .then((data) => {
            console.log(data)
            recordedChunks = []
          })
          .catch((error) => {
            console.error('Error:', error)
          })
      }
    })
    .then(() => {
      mediaRecorder.start()
      isRecording = true
    })
    .catch((error) => {
      console.error('Error accessing media devices: ', error)
    })

  stopwatch = setInterval(updateStopwatch, 1000)
  document.getElementById('recordingStatus').classList.toggle('recording', true)
  const btn = document.getElementById('toggle-recording')
  btn.innerText = 'Stop Recording'
  btn.onclick = stopRecording
}

const stopRecording = () => {
  if (!isRecording) {
    return
  }
  mediaRecorder.stop()
  isRecording = false

  clearInterval(stopwatch)
  seconds = 0
  minutes = 0
  hours = 0

  const status = document.getElementById('recordingStatus')
  status.innerText = 'No Recording'
  status.classList.toggle('recording', false)

  const btn = document.getElementById('toggle-recording')
  btn.innerText = 'Start Recording'
  btn.onclick = startRecording
}

window.startRecording = startRecording
window.stopRecording = stopRecording
window.onload = function () {
  sendCurrentChapter()
}
