import { webrtcActions } from './webrtcActions.js'
import {
  sendChat,
  getSocket,
  addChatItem,
  updatePieChart,
  drawPieChart,
} from './chatActions.js'
import { facialRecognition } from './facialRecognition.js'
import { getEmotionAndTime } from './facialRecognition.js'
import { requestCurrentChapter } from './chatActions.js'

function sendLatestEmotion() {
  const socket = getSocket()
  if (!socket) return

  let { emotionToSend, emotionDetectedUnixTime } = getEmotionAndTime()
  if (Date.now() - emotionDetectedUnixTime > 2000) {
    emotionToSend = 'NOT_DETECTED'
  }
  socket.emit('message', {
    type: 'emotion',
    emotion: emotionToSend,
    timeStamp: emotionDetectedUnixTime,
  })
  addChatItem({
    type: 'emotion',
    content: `[me] ${emotionToSend}`,
    timeStamp: emotionDetectedUnixTime,
  })
}
setInterval(sendLatestEmotion, 1000)
setInterval(updatePieChart, 1000)
drawPieChart()

window.webrtcActions = webrtcActions
window.facialRecognition = facialRecognition
window.sendChat = sendChat
window.requestCurrentChapter = requestCurrentChapter
window.onload = function () {
  console.log('requestCurrentChapter')
  requestCurrentChapter()
}
