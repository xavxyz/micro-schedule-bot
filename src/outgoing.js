/*
 * this file handles the outgoing requests
 */
const schedule = require('node-schedule');
const rp = require('request-promise');
const { readFileSync } = require('fs-promise');
// const { readFile, writeFile } = require('fs-promise');

const { WEBHOOK_URL } = process.env;

/*******
 * time-based scheduler
 * => send slack messages when scheduled
 *******/
 
/*
 * get bot info & scheduled messages from the config
 */ 
const config = readFileSync('_config.json');
const { username, icon_url, scheduledMessages } = JSON.parse(config);

/*
 * loop over the scheduled messages to create Node jobs
 */
const jobs = scheduledMessages.map(
  ({schedule: dateObject, message: messageToSend}) => schedule.scheduleJob(
    /*
     * date object of the shape {hour: 14, minute: 30, dayOfWeek: 1}
     */
    dateObject,
    /*
     * return a promise to post to slack api on the webhook url
     * note: should find a way to use async/await & object spread 
     */
    () => rp({
        uri: WEBHOOK_URL,
        method: 'POST',
        body: Object.assign({}, messageToSend, {
          username,
          icon_url,
        }),
        json: true,
      })
      .then(slackResponse => console.log(`Slack is happy: ${slackResponse}`))
      .catch(slackError => console.log(`Slack is unhappy: ${slackError}`))
  )
);

console.log('debug', schedule.scheduledJobs);

/*******
 * interval-based scheduler:
 * => hacky "cron" to keep the server alive, run every 5 minutes
 *******/
 
setInterval(() => {
  /*
   * create a recognizable header for micro
   */
  const pingConfig = {
    headers: { 'user-agent': 'micro-ping' },
    json: true,
  };
  
  /*
   * ping the server with the header above...
   * note: should find a way to use async/await in this file
   */
  rp(process.env.ROOT_URL || 'http://localhost:3000', pingConfig)
    .then((res) => console.log(res))
    .catch((err) => console.error('ping failed', err.message));
    
  /*
   * ...every 5 minutes
   */
}, 300000);
