import { exec } from 'child_process'
import express from 'express'
import fs from 'fs'
import http from 'http'
import multer from 'multer'
import path, { dirname } from 'path'
import { Server } from 'socket.io'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const port = 8881

const app = express()
const server = http.createServer(app)
const io = new Server(server)

app.use('/dist', express.static(path.join(__dirname, 'dist')))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/view.html')
})
app.get('/talk', (req, res) => {
  res.sendFile(__dirname + '/talk.html')
})
app.get('/talk_test', (req, res) => {
  res.sendFile(__dirname + '/talk_test.html')
})

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, __dirname + '/video-uploads/')
  },
  filename: function (req, file, cb) {
    const timestamp = new Date().toISOString()
    cb(null, 'recorded-video-' + timestamp + path.extname(file.originalname))
  },
})
const upload = multer({ storage: storage })
app.post('/upload', upload.single('file'), (req, res) => {
  console.log('動画がアップロードされました:', req.file.originalname)

  fs.rename(
    req.file.path,
    path.join(path.dirname(req.file.path), req.file.originalname),
    function (err) {
      if (err) {
        console.log('Failed to rename file:', err)
        res.json({ success: false, message: 'Failed to rename file.' })
      } else {
        console.log('File has been saved:', req.file.originalname)
        res.json({ success: true, filename: req.file.originalname })
      }
    }
  )

  exec(
    `python3 video-transcription.py -i ${req.file.originalname}`,
    (error, stdout, stderr) => {
      if (error) {
        console.log(`Error executing script: ${error}`)
        io.emit('video-transcription', {
          success: false,
          filename: req.file.originalname,
        })
      } else {
        console.log(`Script output: ${stdout}`)
        io.emit('video-transcription', {
          success: true,
          filename: req.file.originalname,
        })
      }
    }
  )
})

const pdfData = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, __dirname + '/pdf-data/')
  },
  filename: function (req, file, cb) {
    const timestamp = new Date().toISOString()
    cb(null, 'uploaded-pdf-' + timestamp + path.extname(file.originalname))
  },
})
const pdfUpload = multer({ storage: pdfData })
app.post('/pdf-summary', pdfUpload.single('file'), (req, res) => {
  console.log('PDFがアップロードされました:', req.file.originalname)

  fs.rename(
    req.file.path,
    path.join(path.dirname(req.file.path), req.file.originalname),
    function (err) {
      if (err) {
        console.log('Failed to rename file:', err)
        res.json({ success: false, message: 'Failed to rename file.' })
      } else {
        console.log('File has been saved:', req.file.originalname)
        res.json({ success: true, filename: req.file.originalname })

        exec(
          `python3 pdf-summary.py -i ${req.file.originalname}`,
          (error, stdout, stderr) => {
            if (error) {
              console.log(`Error executing script: ${error}`)
              io.emit('pdf-summary', {
                success: false,
                filename: req.file.originalname,
              })
            } else {
              console.log(`Script output: ${stdout}`)
              io.emit('pdf-summary', {
                success: true,
                filename: req.file.originalname,
              })
            }
          }
        )
      }
    }
  )
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
    console.log('===== Message broadcast', message)
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
