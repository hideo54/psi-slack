# psi-slack

[東京大学システム創成学科 Cコース (PSI: 知能社会システム)](https://www.si.t.u-tokyo.ac.jp/course/psi/) 21期生の Slack で動作する Slack bot のソースコードです。

PSI 生からの pull request は積極的に受け付けます!

## About

`functions/` 以下のソースをもとに、毎時実行される `psiSlackHourlyJob` 関数と、Slack Events を受け取る `psiSlackEventsReceiver` 関数が Cloud Functions 上で動作します。

### psi-news

「学科からのお知らせ」の更新を取得し投稿します。

### faculty-news

工学部ポータルサイトのお知らせの更新を取得し投稿します。

### channel-notifier

新しいチャンネルが作成されたり、チャンネルが unarchive されたりした時に投稿します。

## setup

* `cd functions; cp sample.env .env` + よしなに
* GitHub Actions による自動デプロイは……組んでないです……やりたいね
* Slack App の構成は Manifest 参照。
