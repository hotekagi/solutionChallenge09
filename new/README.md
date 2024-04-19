# Server

## 構成要素

- [LiveKit](https://livekit.io/)による SFU サーバ（port 7880）：WebRTC によるビデオ通話
- Node.js による HTTP サーバ：ページの表示、PDF のアップロード
- Node.js による WebSocket サーバ：チャット・感情認識結果の送受信
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
