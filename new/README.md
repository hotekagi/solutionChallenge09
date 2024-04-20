# Server

## 構成要素

- [LiveKit](https://livekit.io/)による SFU サーバ（port 7880）：WebRTC によるビデオ通話
- Node.js による HTTP サーバ（port 8880）：ページの表示、PDF のアップロード
- Node.js による WebSocket サーバ（port 8880）：チャット・感情認識結果の送受信
- Python による PDF 要約・動画要約：js ファイルから呼び出され、 VertexAI あるいは Gemini API を使用

## Setup Environment

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

## Test LiveKit

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

## Start Server

```shell
livekit-server --dev --bind 0.0.0.0
```

```shell
pnpm start
```

### Viewer

https://[hostname]:8880 にアクセスすると、Viewer ページが表示される。
Viewer ページで「Request」を押すと、ランダムな文字列のユーザとして WebRTC のオンライン会議に接続され、乱数が被らない限り複数の Viewer が接続可能。「Hung Up」を押すと、接続が切断される。
「Start Tracking」を押すと、感情認識が開始される。「Stop Tracking」を押すと、感情認識が停止する。

### Talk

https://[hostname]:8880/talk にアクセスすると、Speaker ページが表示される。
「Connect」を押すと、ユニークな speaker として WebRTC のオンライン会議に接続される。「Disconnect」を押すと、接続が切断される。
Microphone、 Camera、Screen Share のオンオフが可能。
「Start Recording」を押すと、録画が開始され、録画ファイルが `video-uploads` ディレクトリに保存される。「Stop Recording」を押すと、録画が停止する。
Chapter Name で章立ての切り替えが可能。その下のテキストエリアを編集すると、各行が各章の名前して保存され、切り替えの選択肢にも反映される。

### Common

URL の末尾に `?room=[文字列]` を入れると個別ルームを立てられる。
Chat でのメッセージは、全ての Viewer と Talker に送信される。
「Filter to Chat only」を押すと、感情認識の結果を取り除いた Chat にのみ表示される。
