# SmartSyncSeminar

Novel web-based online seminar tool that synchronizes the feelings and knowledge between viewers and speakers

## Software Requirements

- Node.js v16.10.0

  - npm 7.24.0

- Python 3.11.7

- Poppler(https://poppler.freedesktop.org/)

  - pdfimages version 24.02.0

- ffmpeg version 6.1.1(https://ffmpeg.org/)

Note that we expect it to run even with slight version changes, but we tested it only on this specific version.

## Setup Envirionment

In the `/path/to/solutionChallenge09/app` directory, execute the following command:

```shell
$ python3 -m pip install google-generativeai pyyaml pdf2image pillow PyPDF2 openai-whisper
$ npm install
```

## Run Main Server

```shell
$ npm start
```

## How to use

### viewer

1. Enter at http://localhost:9001

   You can send chat message, receive message from other participants, and see results of the facial emotion recognition of other viewers if exist.

   You can also toggle "Filter to Chat only" on, focusing on chat message.

2. Push "Start Tracking" to start facial emotion recognition.

   Tracking of facial features is implemented by using [clmtrackr, Copyright (c) 2017 Audun Mathias Øygard](https://github.com/auduno/clmtrackr).

   You can see how your emotion was recognized at the bottom of the page. When you want to stop the recognition, push "Stop Tracking".

   This page only send the results of the recognition without exchange unnecessary information. This preserve your privacy.

3. Push "Request" to connect to Server.

   If speaker have started streaming, you can watch it.
   Otherwise, wait until speaker's streaming starts.
   When you want to stop watching it, push "Hung Up".

### speaker

1. Enter at http://localhost:9001/talk

   You can send chat message, receive message and emotions from viewers and toggle "Filter to Chat only" on, focusing on chat message.

   Speaker can edit chapter structure by the text area below,
   and select which chapter is in progress.
   Changing the chapter also changes the viewer side.

2. Push "Turn On Camera" to say hello.

3. Push "Share Screen" to start lecture with your materials on the device.

4. Don't forget to push "Start Recording" to save your lecture video on the server.

   This app stop recording for saving and uploading it to the server when you push "Stop Recording" or switch between camera and screen sharing.

   These video files are saved to `app/video-uploads` in webm format. The audio in the video is also converted to mp3 file, transcribed, and summarized in txt file.

5. Summarize and create potential questions for students to review by "Chose File" and "Upload PDF".

   The result can see at `app/pdf-data`, pdf file and summary txt file.

<br>

When you put `?room={some_id} ` at the end of the URL,
another meeting room can be generated according to the value.
This makes it possible to have multiple meetings on one server at the same time by having the speakers and viewers share the room id in advance and having each meeting use a different room.

If you intend to make it publicly accessible and use it across different terminals, use

- ngrok (https://ngrok.com/docs/getting-started/)

  - install and connect your account

and then command

```shell
$ npm start
$ ngrok http 9001
```

## Run Subprogram

### Summarize PDF File

Put PDF file in the folder `pdf-data`.

When executed against `/path/to/solutionChallenge09/app/pdf-data/example.pdf`:

```shell
$ python3 pdf-summary.py -i example.pdf
```

Output:

- standard output: logs of functions and all output results of Gemini API
- `pdf-image/example0001-{number}.jpg`: image of each page of the pdf
- `pdf-data/example.summary.txt`: summarized results for `example.pdf`

### Transcribe and Summarize the Audio

Put webm file in the folder `video-uploads`.

When executed against `/path/to/solutionChallenge09/app/video-uploads/example.webm`:

```shell
$ python3 video-transcription.py -i example.webm
```

Output:

- standard output: logs of functions, result of whisper and Gemini

- `video-uploads/example.mp3`: mp3 file converted from webm

- `video-uploads/example.txt`: summarized results for `example.mp3`
