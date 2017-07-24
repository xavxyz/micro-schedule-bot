/*
 * handle requests & parse them
 */
const { send } = require('micro');
const parse = require('urlencoded-body-parser');

/*
 * read and write through config with promises
 */
const promisify = require('promisify-node');
const { readFile, writeFile } = promisify('fs');

/*
 * schedule jobs to actually send messages to Slack
 */
const { scheduleJob, scheduledJobs } = require('node-schedule');
const request = require('request-promise');

const { checkEnvironment, requestIsPing, requestIsUrlEncoded } = require('./utils');

/*
 * check required environment variables, will throw an error if not well configured
 */
checkEnvironment(process.env);

const { WEBHOOK_URL, SLASH_TOKEN, ALLOWED_USER } = process.env;

/*
 * wrapper around async functions to handle errors
 */
const handleErrors = fn => async (...args) => {
  try {
    return await fn(...args);
  } catch ({ stack = '...', statusCode = 500, message = 'No idea what 😵' }) {
    throw Error(`Something went bad: ${message}`);
  }
};

/*
 * micro request handler for slash command in slack
 */
module.exports = handleErrors(async (req, res) => {
  /*
   * ping to keep alive?
   */
  if (requestIsPing(req)) {
    return 'Ping succeed!';
  }

  /*
   * only accept urlencoded request
   */
  if (!requestIsUrlEncoded(req)) {
    return 'This type of query is not allowed 😵';
  }

  /*
   * extract useful informations from the parsed request
   */
  const {
    token: slackToken,
    user_name: slackSender,
    response_url: slackResponseUrl,
    reset,
  } = await parse(req);

  /*
   * just respond that you can't do that if you are not allowed
   */
  if (slackToken !== SLASH_TOKEN || slackSender !== ALLOWED_USER) {
    return {
      response_type: 'ephemeral',
      text: `Sorry, you can't do that. 😑`,
    };
  }

  /*
   * somehow we want to reset the message counter
   */
  if (reset) {
    // note: should be done with some reset token from a slash command

    /*
     * map over the scheduled jobs and cancel them
     */
    Object.keys(scheduledJobs).map(key => scheduledJobs[key].cancel());

    return {
      response_type: 'ephemeral',
      text: `Messages reset. 👌`,
    };
  }

  const jobs = await addJobs();

  /*
   * respond with an object of the shape expected by Slack
   */
  return {
    response_type: 'ephemeral',
    text: `Bot started! 🤖`,
  };
});

/*
 * time-based scheduler: send slack messages when scheduled
 */
const addJobs = async () => {
  /*
   * get bot info & scheduled messages from the config
   */

  const config = await readFile('_config.json');
  const { username, icon_url, scheduledMessages } = JSON.parse(config);

  /*
   * loop over the scheduled messages to create Node jobs
   */
  return scheduledMessages.map(({ schedule: dateObject, attachment: messageToSend }) => scheduleJob(
    /*
     * date object of the shape {hour: 14, minute: 30, dayOfWeek: 1}
     */
    dateObject,
    /*
     * return a promise to post to slack api on the webhook url
     * note: should find a way to use async/await & object spread 
     */
    handleErrors(async () => {
      const slackResponse = await request({
        uri: WEBHOOK_URL,
        method: 'POST',
        body: {
          username,
          icon_url,
          attachments: [
            Object.assign({}, messageToSend, {
              footer: 'This bot is on Github. <https://github.com/xavcz/micro-schedule-bot|Contributions welcomed!>',
              footer_icon: 'https://assets-cdn.github.com/images/icons/emoji/octocat.png',
            }),
          ],
        },
        json: true,
      });

      console.log(`Slack is happy: ${slackResponse}`);
    })
  ));
};

/*
 * interval-based scheduler: keep the server alive, run every 5 minutes
 */
setInterval(
  handleErrors(async () => {
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
    const ping = await request(process.env.ROOT_URL || 'http://localhost:3000', pingConfig);
    console.log(ping);
  }),
  /*
   * ...every 5 minutes
   */
  300000
);
