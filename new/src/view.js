import { webrtcActions } from './webrtcActions.js'
import { sendChat, getSocket, addChatItem } from './chatActions.js'
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
    timeStamp: Date.now(),
  })
  addChatItem({ type: 'emotion', content: `[me] ${emotionToSend}` })
}
setInterval(sendLatestEmotion, 1000)

window.webrtcActions = webrtcActions
window.facialRecognition = facialRecognition
window.sendChat = sendChat
window.requestCurrentChapter = requestCurrentChapter
window.onload = function () {
  console.log('window.onload')
  console.log('requestCurrentChapter')
  requestCurrentChapter()
}
