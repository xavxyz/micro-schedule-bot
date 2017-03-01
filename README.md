# micro-codecamps-bot

[![Build Status](https://travis-ci.org/xavcz/micro-codecamps-bot.svg?branch=master)](https://travis-ci.org/xavcz/micro-codecamps-bot)

Send scheduled messages to a Slack team.

![screenshot](https://d3uepj124s5rcx.cloudfront.net/items/3L0b2f03471R1Z1z1J0i/Image%202017-03-01%20at%209.20.39%20AM.png?v=b229a1ec)

You'll need a [webhook url](https://api.slack.com/incoming-webhooks), a [slash token](https://api.slack.com/slash-commands) & an allowed username (your username?) from Slack.

```sh
git clone https://github.com/xavcz/micro-codecamps-bot.git
cd micro-codecamps-bot
yarn
WEBHOOK_URL=https://hooks.slack.com/services/xxx/yyy/zzz SLASH_TOKEN=foobar123
ALLOWED_USER=your_username yarn dev
```

Deploy:
```sh
# edit your .env file with the relevant env variables
yarn deploy
```
