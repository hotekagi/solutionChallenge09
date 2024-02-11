const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const multer = require('multer')
const path = require('path')

const BROADCAST_ID = '_broadcast_'

const app = express()
const server = http.createServer(app)
const io = new Server(server)
const port = 9001

app.use('/socket.io', express.static('node_modules/socket.io/dist'))
app.use('/src', express.static('src'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/view.html')
})
app.get('/talk', (req, res) => {
  res.sendFile(__dirname + '/talk.html')
})

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, __dirname + '/uploads/')
  },
  filename: function (req, file, cb) {
    const timestamp = new Date().toISOString()
    cb(null, 'recorded-video-' + timestamp + path.extname(file.originalname))
  },
})
const upload = multer({ storage: storage })
app.post('/upload', upload.single('file'), (req, res) => {
  console.log('動画がアップロードされました:', req.file.filename)
  res.json({ success: true, filename: req.file.filename })
})

server.listen(port, () => {
  console.log('Signaling server started on http://localhost:' + port)
  console.log('view at http://localhost:' + port)
  console.log('talk at http://localhost:' + port + '/talk')
})

io.on('connection', function (socket) {
  // ---- Multi-room ----
  socket.on('enter', function (roomname) {
    socket.join(roomname)
    console.log('id=' + socket.id + ' entered room=' + roomname)
    setRoomname(roomname)
  })

  function setRoomname(room) {
    socket.roomname = room
  }

  function getRoomname() {
    return socket.roomname
  }

  function emitMessage(type, message) {
    // ----- Multi-room ----
    const roomname = getRoomname()

    if (roomname) {
      console.log('===== Message broadcast to room -->' + roomname)
      socket.to(roomname).emit(type, message)
    } else {
      console.log('===== Message broadcast to all')
      socket.broadcast.emit(type, message)
    }
  }

  // When a user sends an SDP message
  // Broadcast to all users in the room
  socket.on('message', function (message) {
    message.from = socket.id

    // Get send target
    const target = message.sendto
    if (target && target !== BROADCAST_ID) {
      console.log('===== Message emit to -->' + target)
      socket.to(target).emit('message', message)
      return
    }

    // Broadcast in the room
    emitMessage('message', message)
  })

  // When the user hangs up
  // Broadcast bye signal to all users in the room
  socket.on('disconnect', function () {
    console.log('-- User disconnect: ' + socket.id)
    // --- Emit ----
    emitMessage('user disconnected', { id: socket.id })

    // --- Leave room --
    const roomname = getRoomname()
    if (roomname) {
      socket.leave(roomname)
    }
  })
})
