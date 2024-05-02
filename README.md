# SmartSyncSeminar

Japanese version: [README_JP.md](README_JP.md)

SmartSyncSeminar is a seminar application aimed at syncing students' emotions and the knowledge teachers want to share in real-time, as if they were in a classroom, based on a simple video conferencing system using [LiveKit](https://livekit.io/), while ensuring privacy through several AI-assisted features.

## Table of Contents

[1. Server Setup and Launch](#1-server-setup-and-launch)

[2. Client Setup and Launch](#2-client-setup-and-launch)

[3. How to Use](#3-how-to-use)

[4. File Structure](#4-file-structure)

## 1. Server Setup and Launch

### 1.1. Environment Verification

The versions of the software used for testing are listed below. However, similar versions may also work. First, follow the steps for each OS to install any missing software, then proceed with the common initial setup.

```shell
$ node -v
v20.9.0

$ pnpm -v
9.0.4

$ livekit-server -v
livekit-server version 1.6.0

$ livekit-cli -v
livekit-cli version 1.4.1

$ venv/bin/python -V
Python 3.12.0

# google-generativeai requires Python 3.9 or higher

$ pdfimages -v
pdfimages version 24.02.0
Copyright 2005-2024 The Poppler Developers - http://poppler.freedesktop.org
Copyright 1996-2011, 2022 Glyph & Cog, LLC

$ ffmpeg -version
ffmpeg version 6.1.1 Copyright (c) 2000-2023 the FFmpeg developers
built with Apple clang version 15.0.0 (clang-1500.1.0.2.5)
# ... continued ...
```

### 1.2. Software Installation Steps on Ubuntu

```shell
# Install Node.js, npm, Python3, pip, ffmpeg, and poppler-utils
$ sudo apt update
$ sudo apt install nodejs npm python3 python3-pip python3-venv ffmpeg poppler-utils -y

# *In Ubuntu 20.04, 'python3*' in the above command may need to be replaced with 'python3.9*', and thereafter also replace the python3 command with python3.9

# Install pnpm
$ npm install -g pnpm

# Install LiveKit
$ curl -sSL https://get.livekit.io | bash
$ curl -sSL https://get.livekit.io/cli | bash
```

### 1.3. Software Installation Steps on Mac

```shell
# Install Homebrew (omitted)
# Install Node.js, npm, Python3, pip, ffmpeg, and poppler-utils
$ brew install node python ffmpeg poppler

# Install pnpm
$ npm install -g pnpm

# Install LiveKit
$ curl -sSL https://get.livekit.io | bash
$ curl -sSL https://get.livekit.io/cli | bash
```

## 1.4. Common Initial Setup

```shell
# Clone the repository
$ git clone https://github.com/hotekagi/solutionChallenge09
$ cd solutionChallenge09

# Install Node.js libraries
$ pnpm install

# Create and activate venv
$ python3 -m venv venv
$ source venv/bin/activate

# Install Python libraries
$ pip install --upgrade pip
$ pip install -r requirements.txt

# Create genai/config.yaml and enter the API key
$ echo "GOOGLE_API_KEY: [API key obtained from Google AI Studio]" > genai/config.yaml

# Or create genai/config.yaml using an editor with the following content
```

`genai/config.yaml` content:

```yaml
GOOGLE_API_KEY: [API key obtained from Google AI Studio]
```

### 1.5. (Optional) Verifying LiveKit Operation

Use the LiveKit sample app to verify that the LiveKit server operates correctly on its own. The server for the main application will be launched in the next section.

**Preparing and launching the LiveKit sample**

```shell
# Download the sample app
$ git clone https://github.com/livekit/client-sdk-js
$ cd client-sdk-js
$ pnpm install
$ pnpm run sample
# Livekit Sample App opens in the browser
```

**Launching the LiveKit server**

```shell
$ livekit-server --dev --bind 0.0.0.0
```

**Generating a user token using LiveKit CLI in another terminal**

```shell
$ livekit-cli create-token --api-key devkey --api-secret secret --join --room my-first-room --identity user1 --valid-for 24h
```

**Connecting using the token in the Livekit Sample App**

Enter the access token in the Livekit Sample App and click 'Connect' to join with the user name specified in `--identity`.

You can generate tokens with different user names using the `--identity` parameter to connect multiple users.

### 1.6. Launching the Server

Run the following two commands in separate terminals.

```shell
# Terminal 1
$ livekit-server --dev --bind 0.0.0.0

# Terminal 2
$ pnpm start
```

Or, execute a script that combines these actions.

```shell
$ ./run.sh
```

## 2. Client Setup and Launch

Assuming Node.js and pnpm are already installed. If not, refer to the [software installation steps](#ubuntu-software-installation-steps)during server setup to install them.

### 2.1. Installing Necessary Libraries

```shell
# Clone the repository
$ git clone https://github.com/hotekagi/solutionChallenge09
$ cd solutionChallenge09

# Install Node.js libraries
$ pnpm install
```

### 2.2 (Optional) Setting the Server's IP Address

If running on a server other than localhost, change the hostname in `src/hostname.js` to the appropriate IP address.

In addition to setting up your own server, you can use our Google Cloud as shown in this [Google Docs](https://docs.google.com/document/d/1pjWlAC4O1NRFcoF0I3YCSk7cA6HhpZrOuChXbRD-aTQ/edit).

Create `src/hostname.js.bak` as follows.

```javascript
// create src/hostname.js.bak and write the following
export const hostname = '[ip address]'
```

Running `swap_hostname_and_rebundle.sh` once swaps `src/hostname.js` with `src/hostname.js.bak`, bundling the files in `dist/` to reflect the new hostname.

```shell
$ ./swap_hostname_and_rebundle.sh
```

Running `swap_hostname_and_rebundle.sh` again swaps back to the original, bundling `dist/` files to reflect the original hostname.

This procedure is followed to avoid publishing IP addresses on GitHub.

### 2.3. (Optional) Reflection in \*.bundle.js when additional proprietary changes are made

If files under `src/` are modified, execute pnpm webpack to reflect the changes in the files under `dist/`.

```shell
$ pnpm webpack
```

### 2.4. Launching the Client

There are three ways to launch the client.

1. Use the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension in VSCode, open `dist/view.html` or `dist/talk.html` in the editor, then click the 'Go Live' button in the bottom right of the editor to launch Live Server automatically, which opens the page in a browser.

2. If the server is already running, accessing `http://${hostname}:8880` displays the Viewer page. Accessing `http://${hostname}:8880/talk` displays the Speaker page.

3. Manually open the HTML files under `dist/` in a browser.

## 3. How to Use

### 3.1. Features of the Viewer

The Viewer has the following features:

- Press 'Connect' on the Viewer page to join a WebRTC online meeting as a user with a random string, with multiple Viewers able to join as long as the random strings do not overlap.

- Press 'Disconnect' to disconnect from the meeting.

- Press 'Start Tracking' to begin emotion recognition. The results are displayed in real-time at the bottom of the page.

- Press 'Stop Tracking' to stop emotion recognition.

### 3.2. Features of the Speaker

The Speaker has the following features:

- Press 'Connect' to join a WebRTC online meeting as a unique user named `speaker`.

- Press 'Disconnect' to disconnect from the meeting.

- When connected, toggle Microphone, Camera, and Screen Share on or off.

- Press 'Start Recording' to begin recording, with the recording time displayed.

- Press 'Stop Recording' to stop recording, simultaneously uploading the recording file to the server and saving it in the `video-uploads` directory. After saving, automatic voice recognition and summarization processes are performed, and the results are also saved on the server.

- Switch the current Chapter using 'Current Chapter'. Changing chapters also changes the display for the Viewer.

- Edit the 'Edit Chapter List' text area at the bottom, where each line is saved as the name of each Chapter, reflecting in the chapter selection options.

- Select a PDF file using 'Browse' or by dragging and dropping.

- Press the 'Delete' button to discard the selection.

- Press 'Upload PDF' to upload the PDF file to the server, saving it in the `pdf-uploads` directory. After saving, automatic image recognition and summarization processes are performed, and the results are also saved on the server.

### 3.3. Common Features

Both Viewer and Speaker share the following features:

- Add `?room=[string]` to the URL to set up individual rooms.

- Messages in Chat are sent to all Viewers and Speakers.

- Press 'Filter to Chat only' to display only the Chat without the results of emotion recognition, while simultaneously displaying the results of emotion recognition in a pie chart.

### 3.4. Standalone Execution of Summary Processing Using Gemini API

Show how to run summary processing using the Gemini API standalone once the server setup is complete.

**Summary Processing of PDF Files**

Place a PDF file in the `genai/pdf-uploads` directory.

When executing for `genai/pdf-uploads/example.pdf`:

```shell
$ venv/bin/python genai/pdf-summary.py -i example.pdf
```

Output:

- Standard output: Logs from `convert_from_path` and all output results from the Gemini API

- `genai/pdf-images`: Images of each page of the PDF

- `genai/pdf-data/{name}.summary.txt`: Summary results for `{name}.pdf`

**Summary Processing of Recorded Audio**

Place a webm file in the `genai/video-uploads` directory.

When executing for `genai/video-uploads/example.webm`:

```shell
$ venv/bin/python genai/video-transcription.py -i example.webm
```

Output:

- Standard output: Function logs, voice recognition results, and all output results from the Gemini API

- `genai/video-uploads/{name}.mp3`: The audio from the webm file converted to mp3
- `genai/video-uploads/{name}.txt`: Voice recognition and summary results for `{name}.mp3`

# 4. File Structure

```shell
SmartSyncSeminar/
├── README.md
├── README_JP.md
├── client-sdk-js/                # LiveKit sample app (if cloned)
├── dist/                         # Directory for distribution files
│   ├── favicon.svg               # favicon
│   ├── styles.css                # CSS
│   ├── talk.bundle.js            # JS loaded by talk.html
│   ├── talk.html                 # Speaker page
│   ├── view.bundle.js            # JS loaded by view.html
│   └── view.html                 # Viewer page
├── genai/                        # Directory for summary processing using Gemini API
│   ├── config.yaml               # File for entering the API key (ignored by .gitignore)
│   ├── pdf-images/               # Images of each page of the PDF file
│   ├── pdf-summary.py            # PDF file summary processing
│   ├── pdf-uploads/              # Uploaded PDF files and summary results
│   ├── video-transcription.py    # Summary processing of recorded audio
│   └── video-uploads/            # Uploaded recorded audio files and summary results
├── legacy/                       # Directory for keeping past version files (see README.md or README_JP.md inside for details)
├── package.json
├── pnpm-lock.yaml
├── requirements.txt
├── run.sh                        # Server startup script
├── server.js                     # File containing HTTP server and WebSocket server processes
├── src/                          # Directory for client source code
│   ├── chatActions.js            # File containing room management, Chat, Chapter, and emotion recognition pie chart processes
│   ├── clmtrackr/                # Directory containing files extracted from clmtrackr (https://github.com/auduno/clmtrackr)
│   │   ├── LICENSE.txt
│   │   ├── clmtrackr.module.js
│   │   └── emotion_classifier.js
│   ├── facialRecognition.js      # File containing the process that calls clmtrackr for emotion recognition
│   ├── hostname.js               # File for setting the server's IP address
│   ├── hostname.js.bak           # File for setting the server's IP address (ignored by .gitignore)
│   ├── talk.js                   # Source code for JS loaded by talk.html
│   ├── view.js                   # Source code for JS loaded by view.html
│   └── webrtcActions.js          # File containing WebRTC processes
├── swap_hostname_and_rebundle.sh # Script to swap hostname.js and hostname.js.bak and rebundle
└── webpack.config.cjs            # webpack configuration file
```
