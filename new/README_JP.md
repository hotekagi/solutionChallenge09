# Server for SmartSyncSeminar

## 構成要素

- [LiveKit](https://livekit.io/)による SFU サーバ（port 7880）：WebRTC によるビデオ通話
- Node.js による HTTP サーバ（port 8880）：ページの表示、PDF や Recording のアップロード
- Node.js による WebSocket サーバ（port 8880）：チャット・感情認識結果の送受信
- Python による PDF 要約・動画要約：js ファイルから呼び出され、 VertexAI あるいは Gemini API を使用

サーバがすでに起動済みである場合は、[Change Hostname](#optional-change-hostname) と [Usage](#usage) を参照すること。

## Setup Environment

動作確認に使用したソフトウェアのバージョンは以下の通り。ただしバージョンはこの通りでなくても近ければ動作すると考えられる。

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

Ubuntu でのセットアップ手順

```shell
# Node.js、npm、Python3、pip が無ければインストール
sudo apt update
sudo apt install nodejs npm python3 python3-pip

# pnpm が無ければインストール
npm install -g pnpm

# LiveKit をインストール
curl -sSL https://get.livekit.io | bash
curl -sSL https://get.livekit.io/cli | bash

# Node.js のライブラリをインストール
pnpm install

# Python のライブラリをインストール
pip install --upgrade pip
pip install -r requirements.txt
```

MacOS でのセットアップ手順

```shell
# Node.js、npm、Python3、pip が無ければインストール
# pnpm が無ければインストール
npm install -g pnpm

# LiveKit をインストール
brew install livekit
brew install livekit-cli

# Node.js のライブラリをインストール
pnpm install

# Python のライブラリをインストール
pip install --upgrade pip
pip install -r requirements.txt
```

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

## Usage of SmartSyncSeminar

特に VSCode の拡張機能である [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) を使う場合には、`dist/view.html` あるいは `dist/talk.html` をエディタで開いた状態で Live Server を起動することで、自動的にブラウザが立ち上がり、ページが表示される。

### Viewer

`dist/view.html` あるいは `http://${hostname}:8880` にアクセスすると、Viewer ページが表示される。
Viewer ページで「Connect」を押すと、ランダムな文字列のユーザとして WebRTC のオンライン会議に接続され、乱数が被らない限り複数の Viewer が接続可能。「Disconnect」を押すと、接続が切断される。
「Start Tracking」を押すと、感情認識が開始される。ページ下部に認識結果がリアルタイムに表示される。「Stop Tracking」を押すと、感情認識が停止する。

### Speaker

`dist/talk.html` あるいは `http://${hostname}:8880/talk` にアクセスすると、Speaker ページが表示される。
「Connect」を押すと、ユニークな `speaker` として WebRTC のオンライン会議に接続される。「Disconnect」を押すと、接続が切断される。
Microphone、 Camera、Screen Share のオンオフが可能。
「Start Recording」を押すと、録画が開始される。「Stop Recording」を押すと、録画が停止すると同時に録画ファイルがサーバにアップロードされ `video-uploads` ディレクトリに保存される。保存されたのち自動で音声認識と要約の処理が行われ、その結果もサーバ上に保存される。
「Current Chapter」で現在の Chapter の切り替えが可能。切り替えと同時に Viewer 側の表示も変更される。下部の「Edit Chapter List」のテキストエリアを編集すると、各行が各 Chapter の名前して保存され、切り替えの選択肢にも反映される。
「Browse」あるいはドラッグアンドドロップで PDF ファイルを選択することができる。「Delete」ボタンで選択を破棄する。「Upload PDF」を押すと、PDF ファイルがサーバにアップロードされ`pdf-data`ディレクトリに保存される。保存されたのち自動で画像認識と要約の処理が行われ、その結果もサーバ上に保存される。

### Common

URL の末尾に `?room=[文字列]` を入れると個別ルームを立てられる。
Chat でのメッセージは、全ての Viewer と Talker に送信される。
「Filter to Chat only」を押すと、感情認識の結果を取り除いた Chat にのみ表示される。
