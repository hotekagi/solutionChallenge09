# Server for SmartSyncSeminar

## 構成要素

- [LiveKit](https://livekit.io/)による SFU サーバ（port 7880）：WebRTC によるビデオ通話
- Node.js による HTTP サーバ（port 8880）：ページの表示、PDF や Recording のアップロード
- Node.js による WebSocket サーバ（port 8880）：チャット・感情認識結果の送受信
- Python(venv) による PDF 要約・動画要約：js ファイルから呼び出され、 VertexAI あるいは Gemini API を使用

サーバがすでに起動済みである場合は、[Client for SmartSyncSeminar](#client-for-smartsyncseminar) に進む。

## Setup Environment

動作確認に使用したソフトウェアのバージョンは以下の通り。ただしバージョンはこの通りでなくても近ければ動作すると考えられる。これらがインストールされていない場合は次節の手順でインストールする。

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

$ pdfimages -v
pdfimages version 24.02.0
Copyright 2005-2024 The Poppler Developers - http://poppler.freedesktop.org
Copyright 1996-2011, 2022 Glyph & Cog, LLC

$ ffmpeg -version
ffmpeg version 6.1.1 Copyright (c) 2000-2023 the FFmpeg developers
built with Apple clang version 15.0.0 (clang-1500.1.0.2.5)
...
```

Ubuntu での初回セットアップ手順

```shell
# Node.js、npm、Python3、pip、ffmpeg、poppler-utils をインストール
sudo apt update
sudo apt install nodejs npm python3 python3-pip ffmpeg poppler-utils -y

# pnpm をインストール
npm install -g pnpm

# LiveKit をインストール
curl -sSL https://get.livekit.io | bash
curl -sSL https://get.livekit.io/cli | bash

# Node.js のライブラリをインストール
pnpm install

# venvを作成してアクティベート
python3 -m venv venv
source venv/bin/activate

# Python のライブラリをインストール
pip install --upgrade pip
pip install -r requirements.txt
```

`genai/config.yaml` を作成し、

```yaml
GOOGLE_API_KEY: [Google AI Studioで取得したAPIキー]
```

を記述する。

MacOS での初回セットアップ手順

```shell
# Node.js、npm、Python3、pip が無ければインストール
# pnpm が無ければインストール
npm install -g pnpm

# LiveKit をインストール
brew install livekit livekit-cli ffmpeg poppler

# Node.js のライブラリをインストール
pnpm install

# venvを作成してアクティベート
python3 -m venv venv
source venv/bin/activate

# Python のライブラリをインストール
pip install --upgrade pip
pip install -r requirements.txt
```

`genai/config.yaml` を作成し、

```yaml
GOOGLE_API_KEY: [Google AI Studioで取得したAPIキー]
```

を記述する。

## (Optional) Change Hostname

さらに、localhost ではないサーバで動かす場合、`src/hostname.js` の `hostname` を適切な IP アドレスに変更する。

```javascript
// src/hostname.js
export const hostname = 'localhost'
```

hostname は以下のように扱われるため、適切に `hostname` を設定する。

```javascript
const wsURL = `ws://${hostname}:7880`
const endpoint = `http://${hostname}:8880/get_room_token`
```

その後、JS ファイルをバンドルし直す。

```shell
pnpm webpack
```

### Swap Hostname and Rebundle

上記の手順を簡略化するためのスクリプトが用意している。

`src/hostname.js.bak` を以下のように作成しておく。

```javascript
// create src/hostname.js.bak and write the following
export const hostname = '[ip address]'
```

`swap_hostname_and_rebundle.sh` を 1 度実行すると、`src/hostname.js` が `src/hostname.js.bak` と入れ替わり、`hostname` が `[ip address]` になった状態でバンドルされる。

```shell
./swap_hostname_and_rebundle.sh
```

再び`swap_hostname_and_rebundle.sh` を実行すると、`src/hostname.js` が `src/hostname.js.bak` と入れ替わって元に戻り、`hostname` が `localhost` になった状態でバンドルされる。

## (Optional) Test LiveKit

LiveKit のサンプルアプリを使って、LiveKit サーバ単体が正常に動作しているか確認する。メインのサーバの起動はつぎのセクションで行う。

クライアントを用意

```shell
git clone https://github.com/livekit/client-sdk-js
cd client-sdk-js/
pnpm install
pnpm run sample
# ブラウザで Livekit Sample App が立ち上がる
```

サーバを起動

```shell
livekit-server --dev --bind 0.0.0.0
```

ユーザのトークンを取得

```shell
livekit-cli create-token --api-key devkey --api-secret secret --join --room my-first-room --identity user1 --valid-for 24h
```

Livekit Sample App の Token にて access token を入力し、「Connect」を押すと、`--identity` に指定したユーザ名で接続される。`--identity` にて異なるユーザ名を指定して別のトークンを生成して使うことで、複数のユーザで接続可能。

## Start App Server

本アプリケーションのサーバを起動する。

```shell
./run.sh

# または以下の2つのコマンドを別々のターミナルでそれぞれ実行する
livekit-server --dev --bind 0.0.0.0
pnpm start
```

# Client for SmartSyncSeminar

サーバがすでに起動済みである場合は、以下の手順でクライアントを起動する。Node.js と pnpm がインストールされていることを前提とする。インストールされていない場合は、[Setup Environment](#setup-environment) を参照。

## (Optional) Change Hostname

localhost ではないサーバで動かす場合、`src/hostname.js` の `hostname` を適切な IP アドレスに変更する。

```javascript
// src/hostname.js
export const hostname = 'localhost'
```

hostname は以下のように扱われるため、適切に `hostname` を設定する。

```javascript
const wsURL = `ws://${hostname}:7880`
const endpoint = `http://${hostname}:8880/get_room_token`
```

その後、JS ファイルをバンドルし直す。

```shell
pnpm webpack
```

### Swap Hostname and Rebundle

上記の手順を簡略化するためのスクリプトが用意している。

`src/hostname.js.bak` を以下のように作成しておく。

```javascript
// create src/hostname.js.bak and write the following
export const hostname = '[ip address]'
```

`swap_hostname_and_rebundle.sh` を 1 度実行すると、`src/hostname.js` が `src/hostname.js.bak` と入れ替わり、`hostname` が `[ip address]` になった状態でバンドルされる。

```shell
./swap_hostname_and_rebundle.sh
```

再び`swap_hostname_and_rebundle.sh` を実行すると、`src/hostname.js` が `src/hostname.js.bak` と入れ替わって元に戻り、`hostname` が `localhost` になった状態でバンドルされる。

# Usage of SmartSyncSeminar

特に VSCode の拡張機能である [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) を使う場合には、`dist/view.html` あるいは `dist/talk.html` をエディタで開いた状態で Live Server を起動することで、自動的にブラウザが立ち上がり、ページが表示される。

## Viewer

`dist/view.html` あるいは `http://${hostname}:8880` にアクセスすると、Viewer ページが表示される。
Viewer ページで「Connect」を押すと、ランダムな文字列のユーザとして WebRTC のオンライン会議に接続され、乱数が被らない限り複数の Viewer が接続可能。「Disconnect」を押すと、接続が切断される。
「Start Tracking」を押すと、感情認識が開始される。ページ下部に認識結果がリアルタイムに表示される。「Stop Tracking」を押すと、感情認識が停止する。

## Speaker

`dist/talk.html` あるいは `http://${hostname}:8880/talk` にアクセスすると、Speaker ページが表示される。
「Connect」を押すと、ユニークな `speaker` として WebRTC のオンライン会議に接続される。「Disconnect」を押すと、接続が切断される。
Microphone、 Camera、Screen Share のオンオフが可能。
「Start Recording」を押すと、録画が開始される。「Stop Recording」を押すと、録画が停止すると同時に録画ファイルがサーバにアップロードされ `video-uploads` ディレクトリに保存される。保存されたのち自動で音声認識と要約の処理が行われ、その結果もサーバ上に保存される。
「Current Chapter」で現在の Chapter の切り替えが可能。切り替えと同時に Viewer 側の表示も変更される。下部の「Edit Chapter List」のテキストエリアを編集すると、各行が各 Chapter の名前して保存され、切り替えの選択肢にも反映される。
「Browse」あるいはドラッグアンドドロップで PDF ファイルを選択することができる。「Delete」ボタンで選択を破棄する。「Upload PDF」を押すと、PDF ファイルがサーバにアップロードされ`pdf-data`ディレクトリに保存される。保存されたのち自動で画像認識と要約の処理が行われ、その結果もサーバ上に保存される。

## Common

URL の末尾に `?room=[文字列]` を入れると個別ルームを立てられる。
Chat でのメッセージは、全ての Viewer と Talker に送信される。
「Filter to Chat only」を押すと、感情認識の結果を取り除いた Chat にのみ表示される。

## Usage of GenAI Function by itself

サーバサイドにて、Gemini API を用いた要約処理を単体で動かす方法を示す。

### pdf-summary.py

`genai/pdf-uploads` ディレクトリに PDF ファイルを置く。

`genai/pdf-uploads/example.pdf` に対して実行した場合

```shell
$ venv/bin/python genai/pdf-summary.py -i example.pdf
```

出力：

- 標準出力：`convert_from_path` のログや Gemini API の出力結果全て
- `genai/pdf-images`：pdf の各ページを画像化したもの
- `genai/pdf-data/{name}.summary.txt`：`{name}.pdf` に対する要約結果

### video-transcription.py

`genai/video-uploads` ディレクトリに webm ファイルを置く。

`genai/video-uploads/example.webm` に対して実行した場合

```shell
$ venv/bin/python genai/video-transcription.py -i example.pdf
```

出力：

- 標準出力：関数のログや音声認識結果、 Gemini API の出力結果全て
- `genai/video-uploads/{name}.mp3`：webm ファイルの音声を mp3 に変換したもの
- `genai/video-uploads/{name}.txt`：`{name}.mp3` に対する音声認識と要約の結果
