# app

WebRTCによる配信

## 使い方

おそらくsocket.ioのv4以降があれば大抵動く。
```
$ node -v
v16.10.0
$ npm -v
7.24.0

{
  "dependencies": {
    "socket.io": "^4.7.4"
  }
}
```

- シグナリングサーバを起動
```
node node signaling.js
```

watch
- ブラウザで`localhost:9001/`を開き、Reuestを押して待つ

talk
- ブラウザで`localhost:9001/talk/`を開く
- Start videoを押すと、カメラ&マイクが起動してP2P通信でwatchと共有される
- Start screenを押すと、画面共有&マイクが起動してP2P通信でwatchと共有される
- Start videoとStart screenは交互に切り替え可能
- Stop streamで配信が止まりwatchと共有されなくなる

その他
- talk1人に対してwatchは複数OK
- URLの末尾に`?room=[文字列]`を入れると個別ルームを立てられる
- localhost以外、他の端末と共有する際にはngrokでサーバを立て、2つのhtml内でsocketを`var socket = io.connect("[httpsから始まるURL]");`に変更、PC以外での動作は未確認
