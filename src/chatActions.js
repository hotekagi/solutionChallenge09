import io from 'socket.io-client'
import { hostname } from './hostname.js'
import { Chart } from 'chart.js/auto'

let socketReady = false

const socket = io.connect(`http://${hostname}:8880`)
socket.on('connect', onOpened).on('message', onMessage)

export function getRoomName() {
  const url = document.location.href
  const args = url.split('?')
  if (args.length > 1) {
    const room = args[1]
    if (room != '') {
      return room
    }
  }
  return '_defaultroom'
}

function onOpened() {
  console.log('socket opened.')
  socketReady = true

  const roomname = getRoomName()
  socket.emit('enter', roomname)
  console.log('enter to ' + roomname)
}

// socket: accept connection request
function onMessage(evt) {
  switch (evt.type) {
    case 'chat':
      console.log('chat', evt)
      addChatItem({
        type: 'chat',
        content: `[${evt.role}] ${evt.chatItem}`,
        timeStamp: evt.timeStamp,
      })
      break

    case 'emotion':
      console.log('emotion', evt)
      addChatItem({
        type: 'emotion',
        content: `[viewer] ${evt.emotion}`,
        timeStamp: evt.timeStamp,
      })
      break

    case 'chapter':
      console.log('chapter', evt)
      const chapterView = document.getElementById('chapterView')
      chapterView.innerText = evt.chapter
      break

    case 'chapter_request':
      console.log('chapter_request', evt)
      setTimeout(() => {
        sendCurrentChapter()
      }, 1000)
      break

    default:
      console.error('invalid message type: ' + evt.type)
      break
  }
}

export function getSocket() {
  if (!socketReady) {
    console.log('socket is not ready.')
    return null
  }
  return socket
}

const chatComments = []

let filterToChatOnly = false
const toggleCheckbox = document.getElementById('toggle-checkbox')
const chatContainer = document.getElementById('chatContainer')

toggleCheckbox.addEventListener('change', function () {
  filterToChatOnly = toggleCheckbox.checked
  reloadChatList()

  if (filterToChatOnly) {
    emotionPieChart.style.display = 'block'
    chatContainer.style.height = '400px'
    chatContainer.style.minHeight = '400px'
  } else {
    emotionPieChart.style.display = 'none'
    chatContainer.style.height = '600px'
    chatContainer.style.minHeight = '600px'
  }
})

function reloadChatList() {
  const chatList = document.getElementById('chatList')
  chatList.innerHTML = ''
  chatComments.forEach((item) => {
    if (filterToChatOnly && item.type !== 'chat') return

    const listItem = document.createElement('li')
    listItem.textContent = item.content

    if (item.type === 'emotion' && item.content.includes('NOT_DETECTED')) {
      listItem.classList.add('emotion-not-detected')
    } else if (item.type === 'emotion' && item.content.includes('angry')) {
      listItem.classList.add('emotion-angry')
    } else if (item.type === 'emotion' && item.content.includes('happy')) {
      listItem.classList.add('emotion-happy')
    } else if (item.type === 'emotion' && item.content.includes('sad')) {
      listItem.classList.add('emotion-sad')
    } else if (item.type === 'emotion' && item.content.includes('surprised')) {
      listItem.classList.add('emotion-surprised')
    }

    chatList.appendChild(listItem)
  })
  document.getElementById('chatContainer').scrollBy(0, chatList.scrollHeight)
}

export function addChatItem(chatItem) {
  // also called in onMessage
  chatComments.push(chatItem)
  reloadChatList()
}

export function sendChat() {
  const newItem = document.getElementById('textInput').value

  if (newItem.trim() !== '') {
    const ts = Date.now()

    socket.emit('message', {
      type: 'chat',
      chatItem: newItem,
      role: 'host',
      timeStamp: ts,
    })
    document.getElementById('textInput').value = ''

    addChatItem({
      type: 'chat',
      content: `[me] ${newItem}`,
      timeStamp: ts,
    })
  }
}

var chapterList = ['Chapter1', 'Chapter2', 'Chapter3']
var currentChapter = 'Chapter1'
var chapterSelect = document.getElementById('chapterSelect')
export function reloadChapterList() {
  chapterSelect.innerHTML = ''
  chapterList.forEach((chapter, index) => {
    const option = document.createElement('option')
    option.value = index
    option.textContent = chapter
    chapterSelect.appendChild(option)
  })
  const chapterEdit = document.getElementById('chapterEdit')
  chapterEdit.value = chapterList.join('\n')
}

export function changeChapter(select) {
  currentChapter = chapterList[select.value]
  socket.emit('message', { type: 'chapter', chapter: currentChapter })
}
export function editChapter(thisElement) {
  chapterList = thisElement.value.split('\n')
  reloadChapterList()

  const select = document.getElementById('chapterSelect')
  currentChapter = chapterList[select.value]
  socket.emit('message', { type: 'chapter', chapter: currentChapter })
}

export function getCurrentChapter() {
  return currentChapter
}
export function requestCurrentChapter() {
  socket.emit('message', { type: 'chapter_request' })
}
export function sendCurrentChapter() {
  socket.emit('message', { type: 'chapter', chapter: currentChapter })
}

const emotionPieChart = document.getElementById('emotionPieChart')
let tmpChart = undefined
const emotionPieChartItemTS = new Array(100).fill({
  emotion: 'NOT_DETECTED',
  timeStamp: Date.now(),
})

export function drawPieChart() {
  const emotionLabels = ['happy', 'surprised', 'angry', 'sad', 'NOT_DETECTED']
  const emotionCounts = new Array(emotionLabels.length).fill(0)
  emotionPieChartItemTS.forEach((item) => {
    emotionLabels.forEach((label, index) => {
      if (item.emotion.includes(label)) {
        emotionCounts[index]++
      }
    })
  })

  if (!tmpChart) {
    tmpChart = new Chart(emotionPieChart, {
      type: 'pie',
      data: {
        labels: emotionLabels,
        datasets: [
          {
            backgroundColor: [
              '#ffff007d', // yellow happy
              '#0080007c', // green surprised
              '#ff00007c', // red angry
              '#0000ff79', // blue sad
              '#8080807d', // gray not detected
            ],
            data: emotionCounts,
          },
        ],
      },
      options: {
        title: {
          display: true,
          text: 'Emotion',
        },
      },
    })
  } else {
    tmpChart.data.datasets[0].data = emotionCounts
    tmpChart.update()
  }
}

export function updatePieChart() {
  let newestTimeStamp = 0
  emotionPieChartItemTS.forEach((item) => {
    if (item.timeStamp > newestTimeStamp) {
      newestTimeStamp = item.timeStamp
    }
  })

  const chatCommentsEmotionsAfterNewestTS = chatComments.filter(
    (item) => item.timeStamp > newestTimeStamp && item.type === 'emotion'
  )

  // No new emotion data
  if (chatCommentsEmotionsAfterNewestTS.length === 0) return

  const emotionsAfterNewestTS = chatCommentsEmotionsAfterNewestTS.map(
    (item) => ({ emotion: item.content, timeStamp: item.timeStamp })
  )

  emotionPieChartItemTS.push(...emotionsAfterNewestTS)

  // Leave only the last chatCommentsEmotionsAfterNewestTS.length * 100 items
  emotionPieChartItemTS.splice(
    0,
    emotionPieChartItemTS.length -
      chatCommentsEmotionsAfterNewestTS.length * 100
  )

  drawPieChart()
}
