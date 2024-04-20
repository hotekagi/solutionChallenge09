import io from 'socket.io-client'

let socketReady = false

const socket = io.connect()
socket.emit('message', { type: 'chapter', chapter: currentChapter })
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
      addChatItem({ type: 'chat', content: `[${evt.role}] ${evt.chatItem}` })
      break

    case 'emotion':
      console.log('emotion', evt)
      addChatItem({ type: 'emotion', content: `[viewer] ${evt.emotion}` })
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
toggleCheckbox.addEventListener('change', function () {
  filterToChatOnly = toggleCheckbox.checked
  reloadChatList()
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
    socket.emit('message', {
      type: 'chat',
      chatItem: newItem,
      role: 'host',
      timeStamp: Date.now(),
    })
    document.getElementById('textInput').value = ''

    addChatItem({ type: 'chat', content: `[me] ${newItem}` })
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
