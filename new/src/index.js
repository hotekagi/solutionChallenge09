import { webrtcActions, handleDevicesChanged } from './webrtcActions.js'
import { sendChat, changeChapter, editChapter } from './chatActions.js'

handleDevicesChanged()
setTimeout(handleDevicesChanged, 100)
window.webrtcActions = webrtcActions
window.sendChat = sendChat
window.changeChapter = changeChapter
window.editChapter = editChapter

const form = document.getElementById('pdf-upload-form')
if (form) {
  form.addEventListener('submit', function (e) {
    e.preventDefault()

    var formData = new FormData(this)

    fetch('/pdf-summary', {
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
}
