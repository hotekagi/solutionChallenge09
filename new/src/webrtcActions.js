import {
  ConnectionQuality,
  LocalParticipant,
  ParticipantEvent,
  RemoteParticipant,
  Room,
  RoomEvent,
  Track,
  ConnectionState,
} from 'livekit-client'
import { getRoomName } from './chatActions.js'
import { hostname } from './hostname.js'

let currentRoom = undefined
let bitrateInterval = undefined
const defaultDevices = new Map()

export function isRoomConnected() {
  return currentRoom && currentRoom.state === ConnectionState.Connected
}

export const webrtcActions = {
  connectToRoom: async () => {
    const wsURL = `ws://${hostname}:7880`
    const getTokenResponse = await fetch(
      `http://${hostname}:8880/get_room_token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: getRoomName(), identity: 'speaker' }),
      }
    )
    if (!getTokenResponse.ok) {
      throw new Error(`HTTP error! response: ${getTokenResponse}`)
    }
    const responseData = await getTokenResponse.json()
    const token = responseData.accessToken

    const room = new Room()
    await room.prepareConnection(wsURL, token)
    console.log(`prewarmed connection`)

    room
      .on(RoomEvent.MediaDevicesChanged, handleDevicesChanged)
      .on(RoomEvent.SignalConnected, async () => {
        console.log(`signal connection established`)
        await room.localParticipant.enableCameraAndMicrophone()
        updateButtonsForPublishState()
        console.log(`enabled camera and microphone`)
      })
      .on(RoomEvent.Disconnected, async () => {
        console.log(`room disconnected`)
        setButtonsForState(false)
        updateButtonsForPublishState()
        renderParticipant(currentRoom.localParticipant, true)
        currentRoom.remoteParticipants.forEach((p) => {
          renderParticipant(p, true)
        })
        renderScreenShare(currentRoom)

        const container = document.getElementById('participants-area')
        if (container) {
          container.innerHTML = ''
        }
        currentRoom = undefined
      })
      .on(RoomEvent.LocalTrackPublished, (pub) => {
        console.log('local track published', pub.trackSid, pub)
        renderParticipant(room.localParticipant)
        updateButtonsForPublishState()
        renderScreenShare(room)
      })
      .on(RoomEvent.LocalTrackUnpublished, (pub) => {
        console.log('local track unpublished', pub.trackSid)
        renderParticipant(room.localParticipant)
        updateButtonsForPublishState()
        renderScreenShare(room)
      })
      .on(RoomEvent.ParticipantConnected, async (participant) => {
        console.log('participant connected', participant.identity)
      })
      .on(RoomEvent.TrackSubscribed, (track, pub, participant) => {
        console.log('track subscribed', track.sid, participant.identity)
        renderParticipant(participant)
        renderScreenShare(room)
      })
      .on(RoomEvent.TrackUnsubscribed, (track, pub, participant) => {
        console.log('track unsubscribed', track.sid, participant.identity)
        renderParticipant(participant)
        renderScreenShare(room)
      })

    await room.connect(wsURL, token)
    console.log(`connected to room`)

    participantConnected(room.localParticipant)

    currentRoom = room
    setButtonsForState(true)

    bitrateInterval = setInterval(renderBitrate, 500)
    return room
  },

  joinAsViewer: async () => {
    const wsURL = `ws://${hostname}:7880`
    const getTokenResponse = await fetch(
      `http://${hostname}:8880/get_room_token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room: getRoomName(),
          identity: Math.random().toString(32).substring(2),
        }),
      }
    )
    if (!getTokenResponse.ok) {
      throw new Error(`HTTP error! response: ${getTokenResponse}`)
    }
    const responseData = await getTokenResponse.json()
    const token = responseData.accessToken

    const room = new Room()
    await room.prepareConnection(wsURL, token)
    console.log(`prewarmed connection`)

    room
      .on(RoomEvent.MediaDevicesChanged, handleDevicesChanged)
      .on(RoomEvent.SignalConnected, async () => {
        console.log(`signal connection established`)
      })
      .on(RoomEvent.Disconnected, async () => {
        console.log(`room disconnected`)
        renderParticipant(currentRoom.localParticipant, true)
        currentRoom.remoteParticipants.forEach((p) => {
          renderParticipant(p, true)
        })
        renderScreenShare(currentRoom)

        const container = document.getElementById('participants-area')
        if (container) {
          container.innerHTML = ''
        }
        currentRoom = undefined
      })
      .on(RoomEvent.LocalTrackPublished, (pub) => {
        console.log('local track published', pub.trackSid, pub)
        renderParticipant(room.localParticipant)
        renderScreenShare(room)
      })
      .on(RoomEvent.LocalTrackUnpublished, (pub) => {
        console.log('local track unpublished', pub.trackSid)
        renderParticipant(room.localParticipant)
        renderScreenShare(room)
      })
      .on(RoomEvent.ParticipantConnected, async (participant) => {
        console.log('participant connected', participant.identity)
      })
      .on(RoomEvent.TrackSubscribed, (track, pub, participant) => {
        console.log('track subscribed', track.sid, participant.identity)
        renderParticipant(participant)
        renderScreenShare(room)
      })
      .on(RoomEvent.TrackUnsubscribed, (track, pub, participant) => {
        console.log('track unsubscribed', track.sid, participant.identity)
        renderParticipant(participant)
        renderScreenShare(room)
      })

    await room.connect(wsURL, token)
    console.log(`connected to room`)

    participantConnected(room.localParticipant)

    currentRoom = room
    bitrateInterval = setInterval(renderBitrate, 500)
    return room
  },

  disconnectRoom: async () => {
    if (currentRoom) {
      await currentRoom.disconnect()
    }
    if (bitrateInterval) {
      clearInterval(bitrateInterval)
    }
  },

  toggleVideo: async () => {
    if (!currentRoom) return

    const lp = currentRoom.localParticipant
    const enabled = lp.isCameraEnabled
    if (enabled) {
      console.log('disabling camera')
    } else {
      console.log('enabling camera')
    }

    await lp.setCameraEnabled(!enabled)
    renderParticipant(lp)
    updateButtonsForPublishState()
  },

  toggleAudio: async () => {
    if (!currentRoom) return

    const lp = currentRoom.localParticipant
    const enabled = lp.isMicrophoneEnabled
    if (enabled) {
      console.log('disabling microphone')
    } else {
      console.log('enabling microphone')
    }

    await lp.setMicrophoneEnabled(!enabled)
    renderParticipant(lp)
    updateButtonsForPublishState()
  },

  shareScreen: async () => {
    if (!currentRoom) return

    const lp = currentRoom.localParticipant
    const enabled = lp.isScreenShareEnabled
    if (enabled) {
      console.log('stopping screen share')
    } else {
      console.log('starting screen share')
    }

    await lp.setScreenShareEnabled(!enabled)
    renderParticipant(lp)
    updateButtonsForPublishState()
  },

  handleDeviceSelected: async (e) => {
    const deviceId = e.target.value
    const elementId = e.target.id
    const kind = elementMapping[elementId]
    if (!kind) {
      return
    }

    defaultDevices.set(kind, deviceId)

    if (currentRoom) {
      await currentRoom.switchActiveDevice(kind, deviceId)
    }
  },
}

function participantConnected(participant) {
  console.log(
    `participant ${participant.identity} connected, ${participant.metadata}`
  )
  console.log('tracks', participant.trackPublications)
  participant
    .on(ParticipantEvent.TrackMuted, (pub) => {
      console.log('track was muted', pub.trackSid, participant.identity)
      renderParticipant(participant)
    })
    .on(ParticipantEvent.TrackUnmuted, (pub) => {
      console.log('track was unmuted', pub.trackSid, participant.identity)
      renderParticipant(participant)
    })
    .on(ParticipantEvent.IsSpeakingChanged, () => {
      renderParticipant(participant)
    })
    .on(ParticipantEvent.ConnectionQualityChanged, () => {
      renderParticipant(participant)
    })
}

function renderParticipant(participant, remove = false) {
  const container = document.getElementById('participants-area')
  if (!container) return
  const { identity } = participant
  if (identity !== 'speaker') return

  let div = document.getElementById(`participant-${identity}`)
  if (!div && !remove) {
    div = document.createElement('div')
    div.id = `participant-${identity}`
    div.className = 'participant'
    if (participant instanceof RemoteParticipant) {
      div.innerHTML = `
              <video id="video-${identity}"></video>
              <audio id="audio-${identity}"></audio>
              <div class="info-bar">
                  <div id="name-${identity}" class="name"></div>
                  <div style="text-align: center;">
                      <span id="codec-${identity}" class="codec"></span>
                      <span id="size-${identity}" class="size"></span>
                      <span id="bitrate-${identity}" class="bitrate"></span>
                  </div>
                  <div class="right">
                      <span id="signal-${identity}"></span>
                      <span id="mic-${identity}" class="mic-on"></span>
                      <span id="e2ee-${identity}" class="e2ee-on"></span>
                  </div>
              </div>
              <progress id="local-volume" max="1" value="0" />
              <div class="volume-control">
                <input id="volume-${identity}" type="range" min="0" max="1" step="0.1" value="1" orient="vertical" />
              </div>`
    } else {
      div.innerHTML = `
      <video id="video-${identity}"></video>
      <audio id="audio-${identity}"></audio>
      <div class="info-bar">
        <div id="name-${identity}" class="name">
        </div>
        <div style="text-align: center;">
          <span id="codec-${identity}" class="codec">
          </span>
          <span id="size-${identity}" class="size">
          </span>
          <span id="bitrate-${identity}" class="bitrate">
          </span>
        </div>
        <div class="right">
          <span id="signal-${identity}"></span>
          <span id="mic-${identity}" class="mic-on"></span>
          <span id="e2ee-${identity}" class="e2ee-on"></span>
        </div>
      </div>
      <progress id="local-volume" max="1" value="0" />`
    }
    container.appendChild(div)

    const sizeElm = document.getElementById(`size-${identity}`)
    const videoElm = document.getElementById(`video-${identity}`)
    videoElm.onresize = () => {
      sizeElm.innerHTML = `${videoElm.videoWidth}x${videoElm.videoHeight}`
    }
  }
  const videoElm = document.getElementById(`video-${identity}`)
  const audioELm = document.getElementById(`audio-${identity}`)
  if (remove) {
    div?.remove()
    if (videoElm) {
      videoElm.srcObject = null
      videoElm.src = ''
    }
    if (audioELm) {
      audioELm.srcObject = null
      audioELm.src = ''
    }
    return
  }

  // update properties
  document.getElementById(`name-${identity}`).innerHTML = participant.identity
  if (participant instanceof LocalParticipant) {
    document.getElementById(`name-${identity}`).innerHTML += ' (you)'
  }
  const micElm = document.getElementById(`mic-${identity}`)
  const signalElm = document.getElementById(`signal-${identity}`)
  const cameraPub = participant.getTrackPublication(Track.Source.Camera)
  const micPub = participant.getTrackPublication(Track.Source.Microphone)
  if (participant.isSpeaking) {
    div.classList.add('speaking')
  } else {
    div.classList.remove('speaking')
  }

  if (participant instanceof RemoteParticipant) {
    const volumeSlider = document.getElementById(`volume-${identity}`)
    volumeSlider.addEventListener('input', (ev) => {
      participant.setVolume(Number.parseFloat(ev.target.value))
    })
  }

  const cameraEnabled =
    cameraPub && cameraPub.isSubscribed && !cameraPub.isMuted
  if (cameraEnabled) {
    if (participant instanceof LocalParticipant) {
      // flip
      videoElm.style.transform = 'scale(-1, 1)'
    } else if (!cameraPub?.videoTrack?.attachedElements.includes(videoElm)) {
      const renderStartTime = Date.now()
      // measure time to render
      videoElm.onloadeddata = () => {
        const elapsed = Date.now() - renderStartTime
        console.log(
          `RemoteVideoTrack ${cameraPub?.trackSid} (${videoElm.videoWidth}x${videoElm.videoHeight}) rendered in ${elapsed}ms`
        )
      }
    }
    cameraPub?.videoTrack?.attach(videoElm)
  } else {
    // clear information display
    document.getElementById(`size-${identity}`).innerHTML = ''
    if (cameraPub?.videoTrack) {
      // detach manually whenever possible
      cameraPub.videoTrack?.detach(videoElm)
    } else {
      videoElm.src = ''
      videoElm.srcObject = null
    }
  }

  const micEnabled = micPub && micPub.isSubscribed && !micPub.isMuted
  if (micEnabled) {
    if (!(participant instanceof LocalParticipant)) {
      // don't attach local audio
      audioELm.onloadeddata = () => {
        console.log(`RemoteAudioTrack ${micPub?.trackSid} played`)
      }
      micPub?.audioTrack?.attach(audioELm)
    }
    micElm.className = 'mic-on'
    micElm.innerHTML = '<i class="fas fa-microphone"></i>'
  } else {
    micElm.className = 'mic-off'
    micElm.innerHTML = '<i class="fas fa-microphone-slash"></i>'
  }

  const e2eeElm = document.getElementById(`e2ee-${identity}`)
  if (participant.isEncrypted) {
    e2eeElm.className = 'e2ee-on'
    e2eeElm.innerHTML = '<i class="fas fa-lock"></i>'
  } else {
    e2eeElm.className = 'e2ee-off'
    e2eeElm.innerHTML = '<i class="fas fa-unlock"></i>'
  }

  switch (participant.connectionQuality) {
    case ConnectionQuality.Excellent:
    case ConnectionQuality.Good:
    case ConnectionQuality.Poor:
      signalElm.className = `connection-${participant.connectionQuality}`
      signalElm.innerHTML = '<i class="fas fa-circle"></i>'
      break
    default:
      signalElm.innerHTML = ''
    // do nothing
  }
}

function renderScreenShare(room) {
  console.log('renderScreenShare')

  const div = document.getElementById('screenshare-area')
  if (!div) return

  if (room.state !== ConnectionState.Connected) {
    div.style.display = 'none'
    return
  }

  let participant = undefined
  let screenSharePub = room.localParticipant.getTrackPublication(
    Track.Source.ScreenShare
  )
  let screenShareAudioPub = undefined

  if (!screenSharePub) {
    room.remoteParticipants.forEach((p) => {
      if (screenSharePub) return

      participant = p
      const pub = p.getTrackPublication(Track.Source.ScreenShare)
      if (pub && pub.isSubscribed) {
        screenSharePub = pub
      }

      const audioPub = p.getTrackPublication(Track.Source.ScreenShareAudio)
      if (audioPub && audioPub.isSubscribed) {
        screenShareAudioPub = audioPub
      }
    })
  } else {
    participant = room.localParticipant
  }

  if (screenSharePub && participant) {
    div.style.display = 'block'
    const videoElm = document.getElementById('screenshare-video')
    screenSharePub.videoTrack?.attach(videoElm)
    if (screenShareAudioPub) {
      screenShareAudioPub.audioTrack?.attach(videoElm)
    }
    videoElm.onresize = () => {
      const sizeElm = document.getElementById('screenshare-resolution')
      sizeElm.innerHTML = `${videoElm.videoWidth}x${videoElm.videoHeight}`
    }

    const infoElm = document.getElementById('screenshare-info')
    infoElm.innerHTML = `Screenshare from ${participant.identity}`
  } else {
    div.style.display = 'none'
  }
}

function renderBitrate() {
  if (!currentRoom || currentRoom.state !== 'Connected') return

  const participants = [...currentRoom.remoteParticipants.values()]
  participants.push(currentRoom.localParticipant)

  for (const p of participants) {
    const elm = document.getElementById(`bitrate-${p.identity}`)
    let totalBitrate = 0

    for (const t of p.trackPublications.values()) {
      if (t.track) {
        totalBitrate += t.track.currentBitrate
      }

      if (t.source === 'Camera' && t.videoTrack instanceof RemoteVideoTrack) {
        const codecElm = document.getElementById(`codec-${p.identity}`)
        if (codecElm) {
          codecElm.innerHTML = t.videoTrack.getDecoderImplementation() || ''
        }
      }
    }

    let displayText = ''
    if (totalBitrate > 0) {
      displayText = `${Math.round(totalBitrate / 1024).toLocaleString()} kbps`
    }

    if (elm) {
      elm.innerHTML = displayText
    }
  }
}

const connectButton = document.getElementById('connect-button')
const disconnectRoomButton = document.getElementById('disconnect-room-button')
const toggleVideoButton = document.getElementById('toggle-video-button')
const toggleAudioButton = document.getElementById('toggle-audio-button')
const shareScreenButton = document.getElementById('share-screen-button')

function setButtonsForState(connected) {
  const notConnected = !connected

  connectButton.disabled = connected
  disconnectRoomButton.disabled = notConnected

  toggleVideoButton.disabled = notConnected
  toggleAudioButton.disabled = notConnected
  shareScreenButton.disabled = notConnected
}

function updateButtonsForPublishState() {
  if (!currentRoom) {
    return
  }

  const lp = currentRoom.localParticipant
  toggleVideoButton.innerHTML = `${
    lp.isCameraEnabled ? 'Disable' : 'Enable'
  } Video`
  toggleAudioButton.innerHTML = `${
    lp.isMicrophoneEnabled ? 'Disable' : 'Enable'
  } Audio`
  shareScreenButton.innerHTML = lp.isScreenShareEnabled
    ? 'Stop Screen Share'
    : 'Share Screen'
}

const elementMapping = {
  'video-input': 'videoinput',
  'audio-input': 'audioinput',
  'audio-output': 'audiooutput',
}

export async function handleDevicesChanged() {
  await Promise.all(
    Object.keys(elementMapping).map(async (id) => {
      const kind = elementMapping[id]
      if (!kind) {
        return
      }
      const devices = await Room.getLocalDevices(kind)
      const element = document.getElementById(id)
      populateSelect(element, devices, defaultDevices.get(kind))
    })
  )
}

function populateSelect(element, devices, selectedDeviceId) {
  // Clear all elements
  element.innerHTML = ''

  for (const device of devices) {
    const option = document.createElement('option')
    option.text = device.label
    option.value = device.deviceId
    if (device.deviceId === selectedDeviceId) {
      option.selected = true
    }
    element.appendChild(option)
  }
}
