# Server for SmartSyncSeminar

## Components

**SFU server using [LiveKit](https://livekit.io/) (port 7880):**
Enables video calls via WebRTC
HTTP server using Node.js (port 8880): Handles page rendering, PDF uploads, and recording

**WebSocket server using Node.js (port 8880):**
Facilitates chat and transmission of emotion recognition results
PDF summarization and video summarization using Python: Invoked from JavaScript files, utilizing VertexAI or Gemini API

If the server is already running, refer to [Change Hostname](#optional-change-hostname) and [Usage](#usage).

## Setup Environment

The software versions used for testing are as follows. However, similar versions should suffice for functionality.

```shell
$ node -v
v20.9.0

$ pnpm -v
9.0.4

$ livekit-server -v
livekit-server version 1.6.0

$ livekit-cli -v
livekit-cli version 1.4.1
```

**Setup steps for Ubuntu:**

```shell
# Install Node.js, npm, Python3, pip if not already installed

sudo apt update
sudo apt install nodejs npm python3 python3-pip

# Install pnpm if not already installed

npm install -g pnpm

# Install LiveKit

curl -sSL https://get.livekit.io | bash
curl -sSL https://get.livekit.io/cli | bash

# Install Node.js libraries

pnpm install

# Install Python libraries

pip install --upgrade pip
pip install -r requirements.txt
```

**Setup steps for MacOS:**

```shell
# Install Node.js, npm, Python3, pip if not already installed

# Install pnpm if not already installed

npm install -g pnpm

# Install LiveKit

brew install livekit
brew install livekit-cli

# Install Node.js libraries

pnpm install

# Install Python libraries

pip install --upgrade pip
pip install -r requirements.txt
```

## (Optional) Change Hostname

Additionally, if running on a server other than localhost, modify the hostname in src/hostname.js to the appropriate IP address.

```javascript
// src/hostname.js
export const hostname = 'localhost'
```

Ensure the hostname is properly set as it's utilized as follows:

```javascript
const wsURL = `ws://${hostname}:7880`
const endpoint = `http://${hostname}:8880/get_room_token`
```

Then, re-bundle the JavaScript files:

```shell
pnpm webpack
```

## (Optional) Test LiveKit

Use the LiveKit sample app to verify if the LiveKit server is functioning correctly standalone. Starting the main server is done in the next section.

**Prepare the client:**

```shell
git clone https://github.com/livekit/client-sdk-js
cd client-sdk-js/
pnpm install
pnpm run sample
# Livekit Sample App will launch in the browser
```

**Start the server:**

```shell
livekit-server --dev --bind 0.0.0.0
```

**Obtain user tokens:**

```shell
livekit-cli create-token --api-key devkey --api-secret secret --join --room my-first-room --identity user1 --valid-for 24h
```

Enter the access token from the Livekit Sample App into the Token field and click "Connect" to establish a connection with the username specified in --identity. Different usernames can be specified with --identity to generate and use separate tokens for multiple users to connect.

## Start App Server

Launch the server for this application.

```shell
./run.sh

# Alternatively, execute the following two commands separately in different terminals

livekit-server --dev --bind 0.0.0.0
pnpm start
```

## Usage

### Viewer

Access dist/view.html or http://${hostname}:8880 to view the Viewer page.

Pressing "Connect" on the Viewer page connects to WebRTC online conferences as a user with a random string, allowing multiple Viewers to connect as long as the random numbers don't overlap. Press "Disconnect" to disconnect.

Pressing "Start Tracking" initiates emotion recognition. Recognition results are displayed in real-time at the bottom of the page. Press "Stop Tracking" to stop emotion recognition.

### Speaker

Access dist/talk.html or http://${hostname}:8880/talk to view the Speaker page.

Press "Connect" to connect to WebRTC online conferences as a unique speaker. Press "Disconnect" to disconnect.

Microphone, camera, and screen share can be toggled on and off.

Press "Start Recording" to begin recording. Press "Stop Recording" to stop recording; simultaneously, the recording file is uploaded to the server and saved in the video-uploads directory. After saving, automatic speech recognition and summarization processes are performed on the server, and the results are also saved on the server.

"Current Chapter" allows switching between chapters. Viewer display changes accordingly upon switching. Editing the text area of "Edit Chapter List" saves each line as the name of each chapter, reflecting the choices for switching.

Select a PDF file by clicking "Browse" or dragging and dropping. Use the "Delete" button to discard the selection. Press "Upload PDF" to upload the PDF file to the server, where it is saved in the pdf-data directory. After saving, automatic image recognition and summarization processes are performed on the server, and the results are also saved on the server.

### Common

Append ?room=[string] to the URL to create individual rooms.

All chat messages are sent to all Viewers and Talkers.
Pressing "Filter to Chat only" displays only the chat messages, excluding emotion recognition results.
