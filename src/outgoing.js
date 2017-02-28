/*
 * this file handles the outgoing requests
 */
const schedule = require('node-schedule');
const rp = require('request-promise');
const { readFile, writeFile } = require('fs-promise');

/*
 * time-based scheduler: send slack messages
 */
 

 
// schedule.scheduleJob({
//   // some date
//   dayOfWeek: 1,
//   hour: 19, 
//   minute: 30, 
// }, () => {
//   /*
//    * extract the bot configuration and the messages from the config file
//    */
//   const config = fs.readFileSync('_config.json');
//   const { username, icon_url, messages, messageToSendIndex } = JSON.parse(config);
// 
//   /*
//    * grab the message to send from the messages list
//    */
//   const messageToSend = messages[messageToSendIndex];
// 
//   const slackMessage = rp({
//     uri: WEBHOOK_URL,
//     method: 'POST',
//     body: Object.assign({}, messageObject, {
//       username,
//       icon_url,
//     }),
//     json: true,
//   });
// 
// 
//   /*
//    * grab the message to send from the messages list
//    */
// });



/*
 * interval-based scheduler: hacky "cron" to keep the server alive, run every 5 minutes
 */
setInterval(() => {
  const pingConfig = {
    headers: { 'user-agent': 'micro-ping' },
    json: true,
  };
  
  rp(process.env.ROOT_URL || 'http://localhost:3000', pingConfig)
    .then((res) => console.log(res))
    .catch((err) => console.error('ping failed', err.message));
}, 300000);
