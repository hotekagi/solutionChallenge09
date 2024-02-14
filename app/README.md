# app

WebRTC による配信

## 使い方

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

```shell
# ngrokをinstall
# (macOSでHomebrewを使う場合)
$ brew install ngrok

# アカウント登録
# https://zenn.dev/protoout/articles/47-ngrok-setup-2022

# トークンを登録
$ ngrok authtoken 前手順で取得したトークン

# localhostをWebサーバとして外部公開
$ ngrok http ngrok http 9001
```

https から始まる一時 URL が発行されるので、
その URL が view、URL/talk が talk として同様に利用できる。
