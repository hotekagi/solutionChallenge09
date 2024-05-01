# SmartSyncSeminar

英語版の README は [こちら](README.md)。

SmartSyncSeminar は、[LiveKit](https://livekit.io/) を用いたシンプルなビデオ会議システムをベースに、AI によるいくつかの補助機能により、プライバシーを担保しつつ、まるで教室にいるかのように生徒の感情や先生が共有したい知識をリアルタイムに同期させることを目指したセミナー用アプリケーションである。

## 1. サーバのセットアップと起動

### 1.1. 動作確認環境

動作確認に使用したソフトウェアのバージョンは以下の通り。ただしバージョンはこの通りでなくても近ければ動作すると考えられる。まず各 OS での手順に従って、不足しているソフトウェアがあればインストールする。その後、共通の初回セットアップを行う。

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

# google-generativeaiがPython 3.9 以上を要求する

$ pdfimages -v
pdfimages version 24.02.0
Copyright 2005-2024 The Poppler Developers - http://poppler.freedesktop.org
Copyright 1996-2011, 2022 Glyph & Cog, LLC

$ ffmpeg -version
ffmpeg version 6.1.1 Copyright (c) 2000-2023 the FFmpeg developers
built with Apple clang version 15.0.0 (clang-1500.1.0.2.5)
# ... 以下略 ...
```

### 1.2. Ubuntu での必要ソフトウェアのインストール手順

```shell
# Node.js、npm、Python3、pip、ffmpeg、poppler-utils をインストール
$ sudo apt update
$ sudo apt install nodejs npm python3 python3-pip python3-venv ffmpeg poppler-utils -y

# ※Ubuntu 20.04 の場合、上記コマンドの 'python3*' を 'python3.9*' にして、以降もpython3コマンドをpython3.9に置き換える必要があることもある


# pnpm をインストール
$ npm install -g pnpm

# LiveKit をインストール
$ curl -sSL https://get.livekit.io | bash
$ curl -sSL https://get.livekit.io/cli | bash
```

### 1.3. Mac での必要ソフトウェアのインストール手順

```shell
# Homebrew をインストール (略)
# Node.js、npm、Python3、pip、ffmpeg、poppler-utils をインストール
$ brew install node python ffmpeg poppler

# pnpm をインストール
$ npm install -g pnpm

# LiveKit をインストール
$ curl -sSL https://get.livekit.io | bash
$ curl -sSL https://get.livekit.io/cli | bash
```

### 1.4. 共通の初回セットアップ手順

```shell
# リポジトリをクローン
$ git clone https://github.com/hotekagi/solutionChallenge09
$ cd solutionChallenge09

# Node.js のライブラリをインストール
$ pnpm install

# venv を作成してアクティベート
$ python3 -m venv venv
$ source venv/bin/activate

# Python のライブラリをインストール
$ pip install --upgrade pip
$ pip install -r requirements.txt

# genai/config.yaml を作成し、API キーを記入
$ echo "GOOGLE_API_KEY: [Google AI Studio で取得した API キー]" > genai/config.yaml

# あるいは、エディタで genai/config.yaml を作成し、以下の内容を記入
```

`genai/config.yaml`の内容:

```yaml
GOOGLE_API_KEY: [Google AI Studio で取得した API キー]
```

### 1.5. (省略可) LiveKit の動作確認

LiveKit のサンプルアプリを使って、LiveKit サーバ単体が正常に動作しているか確認する。本アプリケーションのサーバの起動はつぎのセクションで行う。

#### LiveKit のサンプルを用意して起動

```shell
# サンプルアプリをダウンロード
$ git clone https://github.com/livekit/client-sdk-js
$ cd client-sdk-js
$ pnpm install
$ pnpm run sample
# ブラウザで Livekit Sample App が開く
```

#### LiveKit サーバを起動

```shell
$ livekit-server --dev --bind 0.0.0.0
```

#### 別のターミナルで LiveKit CLI を使ってユーザのトークンを生成

```shell
$ livekit-cli create-token --api-key devkey --api-secret secret --join --room my-first-room --identity user1 --valid-for 24h
```

#### Livekit Sample App でトークンを入力して接続

Livekit Sample App の Token にて access token を入力し、「Connect」を押すと、`--identity` に指定したユーザ名で接続される。

トークン生成のコマンドにおける`--identity` にて異なるユーザ名を指定して別のトークンを生成して使うことで、複数のユーザで接続可能。

### 1.6. サーバの起動

以下の 2 つのコマンドを別々のターミナルでそれぞれ実行する。

```shell
# ターミナル 1
$ livekit-server --dev --bind 0.0.0.0

# ターミナル 2
$ pnpm start
```

または、それらをまとめたスクリプトを実行する。

```shell
$ ./run.sh
```

## 2. クライアントのセットアップと起動

Node.js と pnpm がインストールされていることを前提とする。インストールされていない場合は、[サーバのセットアップ時のインストール手順](#ubuntu-での必要ソフトウェアのインストール手順)を参照してインストールする。

### 2.1. 必要なライブラリをインストール

```shell
# リポジトリをクローン
$ git clone https://github.com/hotekagi/solutionChallenge09
$ cd solutionChallenge09

# Node.js のライブラリをインストール
$ pnpm install
```

### 2.2 (省略可) サーバの IP アドレスを設定

localhost ではないサーバで動かす場合、`src/hostname.js` の `hostname` を適切な IP アドレスに変更する。

`src/hostname.js.bak` を以下のように作成しておく。

```javascript
// create src/hostname.js.bak and write the following
export const hostname = '[ip address]'
```

`swap_hostname_and_rebundle.sh` を 1 度実行すると、`src/hostname.js` が `src/hostname.js.bak` と入れ替わり、`hostname` が `[ip address]` になった状態でバンドルされ、`dist/` 以下のファイルに反映される。

```shell
$ ./swap_hostname_and_rebundle.sh
```

再び`swap_hostname_and_rebundle.sh` を実行すると、`src/hostname.js` が `src/hostname.js.bak` と入れ替わって元に戻り、`hostname` が `localhost` になった状態でバンドルされ、`dist/` 以下のファイルが元に戻る。

GitHub に IP アドレスを公開しないように、このような手順を取っている。

### 2.3. (省略可) \*.bundle.js への反映

`src/` 以下のファイルを変更した場合、`pnpm webpack` を実行して `dist/` 以下のファイルに反映させる。

```shell
$ pnpm webpack
```

### 2.4. クライアントの起動

以下の 3 つの方法がある。

1. VSCode の拡張機能である [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) を用い、`dist/view.html` あるいは `dist/talk.html` をエディタで開いた状態でエディタ右下の「Go Live」ボタンを押して Live Server を起動することで、自動的にブラウザが立ち上がり、ページが表示される。

2. サーバがすでに起動済みである場合は、`http://${hostname}:8880` にアクセスすると、Viewer ページが表示される。また、`http://${hostname}:8880/talk` にアクセスすると、Speaker ページが表示される。

3. 手動で`dist/` 以下の HTML ファイルをブラウザで開く。

## 3. 使い方

### 3.1. Viewer の機能

Viewer は、以下の機能を持つ。

Viewer ページで「Connect」を押すと、ランダムな文字列のユーザとして WebRTC のオンライン会議に接続され、乱数が被らない限り複数の Viewer が接続可能。

「Disconnect」を押すと、接続が切断される。

「Start Tracking」を押すと、感情認識が開始される。ページ下部に認識結果がリアルタイムに表示される。

「Stop Tracking」を押すと、感情認識が停止する。

### 3.2. Speaker の機能

Speaker は、以下の機能を持つ。

「Connect」を押すと、ユニークなユーザである `speaker` として WebRTC のオンライン会議に接続される。

「Disconnect」を押すと、接続が切断される。

接続時には Microphone、 Camera、Screen Share のオンオフが可能。

「Start Recording」を押すと、録画が開始され、録画の時間が表示される。

「Stop Recording」を押すと、録画が停止すると同時に録画ファイルがサーバにアップロードされ `video-uploads` ディレクトリに保存される。保存されたのち自動で音声認識と要約の処理が行われ、その結果もサーバ上に保存される。

「Current Chapter」で現在の Chapter の切り替えが可能。切り替えと同時に Viewer 側の表示も変更される。

下部の「Edit Chapter List」のテキストエリアを編集すると、各行が各 Chapter の名前して保存され、切り替えの選択肢にも反映される。

「Browse」あるいはドラッグアンドドロップで PDF ファイルを選択することができる。

「Delete」ボタンで選択を破棄する。

「Upload PDF」を押すと、PDF ファイルがサーバにアップロードされ `pdf-data` ディレクトリに保存される。保存されたのち自動で画像認識と要約の処理が行われ、その結果もサーバ上に保存される。

### 3.3. 共通の機能

Viewer と Speaker で共通の機能は以下の通り。

URL の末尾に `?room=[文字列]` を入れると個別ルームを立てられる。

Chat でのメッセージは、全ての Viewer と Speaker に送信される。
「Filter to Chat only」を押すと、感情認識の結果を取り除いた Chat にのみ表示されると同時に、感情認識の結果が円グラフで表示される。

### 3.4. Gemini API による要約処理を単体で実行する方法

サーバのセットアップが全て済んでいる状態にて、Gemini API を用いた要約処理を単体で動かす方法を示す。

#### PDF ファイルの要約処理

`genai/pdf-uploads` ディレクトリに PDF ファイルを置く。

`genai/pdf-uploads/example.pdf` に対して実行した場合

```shell
$ venv/bin/python genai/pdf-summary.py -i example.pdf
```

出力：

- 標準出力：`convert_from_path` のログや Gemini API の出力結果全て
- `genai/pdf-images`：pdf の各ページを画像化したもの
- `genai/pdf-data/{name}.summary.txt`：`{name}.pdf` に対する要約結果

#### 録画音声の要約処理

`genai/video-uploads` ディレクトリに webm ファイルを置く。

`genai/video-uploads/example.webm` に対して実行した場合

```shell
$ venv/bin/python genai/video-transcription.py -i example.webm
```

出力：

- 標準出力：関数のログや音声認識結果、 Gemini API の出力結果全て
- `genai/video-uploads/{name}.mp3`：webm ファイルの音声を mp3 に変換したもの
- `genai/video-uploads/{name}.txt`：`{name}.mp3` に対する音声認識と要約の結果

## 4. ファイル構成

```shell
SmartSyncSeminar/
├── README.md
├── README_JP.md
├── client-sdk-js/                # LiveKit のサンプルアプリ(cloneした場合)
├── dist                          # 配信用ファイルが置かれるディレクトリ
│   ├── favicon.svg               # favicon
│   ├── styles.css                # CSS
│   ├── talk.bundle.js            # talk.html で読み込む JS
│   ├── talk.html                 # Speaker ページ
│   ├── view.bundle.js            # view.html で読み込む JS
│   └── view.html                 # Viewer ページ
├── genai                         # Gemini API を用いた要約処理のディレクトリ
│   ├── config.yaml               # API キーを記入するファイル (.gitignore されている)
│   ├── pdf-images                # PDF ファイルの各ページを画像化したもの
│   ├── pdf-summary.py            # PDF ファイルの要約処理
│   ├── pdf-uploads               # アップロードされた PDF ファイルおよび要約結果
│   ├── video-transcription.py    # 録画音声の要約処理
│   └── video-uploads             # アップロードされた録画音声ファイルおよび要約結果
├── legacy                        # 過去バージョンのファイルを残しているディレクトリ(詳細は内部にある README.md あるいは README_JP.md を参照)
├── package.json
├── pnpm-lock.yaml
├── requirements.txt
├── run.sh                        # サーバの起動スクリプト
├── server.js                     # HTTPサーバおよびwebsoketサーバの処理が書かれたファイル
├── src                           # クライアントのソースコードが置かれるディレクトリ
│   ├── chatActions.js            # 部屋管理、Chat、Chapter、感情認識の円グラフ の処理が書かれたファイル
│   ├── clmtrackr                 # clmtrackr(https://github.com/auduno/clmtrackr) から一部切り出したファイルが置かれるディレクトリ
│   │   ├── clmtrackr.module.js
│   │   └── emotion_classifier.js
│   ├── facialRecognition.js      # clmtrackrを呼び出して感情認識をする処理が書かれたファイル
│   ├── hostname.js               # サーバの IP アドレスを設定するファイル
│   ├── hostname.js.bak           # サーバの IP アドレスを設定するファイル (.gitignore されている)
│   ├── talk.js                   # talk.html で読み込む JS のソースコードが書かれたファイル
│   ├── view.js                   # view.html で読み込む JS のソースコードが書かれたファイル
│   └── webrtcActions.js          # WebRTC の処理が書かれたファイル
├── swap_hostname_and_rebundle.sh # hostname.js と hostname.js.bak を入れ替えてバンドルするスクリプト
└── webpack.config.cjs            # webpack の設定ファイル
```
