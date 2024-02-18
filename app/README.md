# app

WebRTC による配信

## pdf-summary.py, video-transcription.py

構成要素として Python のサブプログラムを使用する

```shell
$ python3 -V
Python 3.11.7
```

### セットアップ

package の install

```shell
$ python3 -m pip install google-generativeai pyyaml pdf2image pillow PyPDF2 openai-whisper
```

package の他に、poppler, ffmpeg を事前に install して PATH を通す

TeX に付属して知らぬ間に入っている可能性があるらしい

```shell
# (macOSでHomebrewを使う場合)
$ brew install poppler
$ brew install ffmpeg

# このコマンドが使えればOK、バージョンは異なっていても動くはず
$ pdfimages -v
pdfimages version 24.02.0
Copyright 2005-2024 The Poppler Developers - http://poppler.freedesktop.org
Copyright 1996-2011, 2022 Glyph & Cog, LLC

$ ffmpeg -version
ffmpeg version 6.1.1 Copyright (c) 2000-2023 the FFmpeg developers
built with Apple clang version 15.0.0 (clang-1500.1.0.2.5)
...
```

### pdf-summary.py 単体での使い方

`pdf-data`の配下に PDF ファイルを置く

`app/pdf-data/example.pdf`に対して実行した場合

```shell
$ python3 pdf-summary.py -i example.pdf
```

出力：

- 標準出力：convert_from_path のログや Gemini API の出力結果全て
- `pdf-image`：pdf の各ページを画像化したもの
- `pdf-data/{name}.summary.txt`：`{name}.pdf`に対する要約結果

### video-transcription.py 単体での使い方

`video-uploads`の配下に webm ファイルを置く

`app/video-uploads/example.webm`に対して実行した場合

```shell
$ python3 video-transcription.py -i example.pdf
```

## app の使い方

おそらくバージョンは合わせなくても大抵動く。

```shell
$ node -v
v16.10.0
$ npm -v
7.24.0

# install dependencies
$ npm install
# start server
$ npm start
```

watch

- ブラウザで`localhost:9001/`を開き、Reuest を押して待つ

talk

- ブラウザで`localhost:9001/talk/`を開く
- Start video を押すと、カメラ&マイクが起動して P2P 通信で watch と共有される
- Start screen を押すと、画面共有&マイクが起動して P2P 通信で watch と共有される
- Start video と Start screen は交互に切り替え可能
- Stop stream で配信が止まり watch と共有されなくなる

その他

- talk1 人に対して watch は複数 OK
- URL の末尾に`?room=[文字列]`を入れると個別ルームを立てられる
- localhost 以外、他の端末と共有する際には ngrok でサーバを立て、2 つの html 内で socket を`var socket = io.connect("[httpsから始まるURL]");`に変更、Chrome(MacOS)以外での動作は未確認

## 異なる端末で配信・受信を行う

ngrok を install する

```shell
# (macOSでHomebrewを使う場合)
$ brew install ngrok


# アカウント登録が必要
# https://zenn.dev/protoout/articles/47-ngrok-setup-2022

# トークンを登録
$ ngrok config add-authtoken <token>

# localhostをWebサーバとして外部公開
$ ngrok http ngrok http 9001
```

https から始まる一時 URL が発行されるので、
その URL が view、URL/talk が talk として同様に利用できる。
