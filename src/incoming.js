/*
 * this file, main entry point, handles the incoming request to the server
 */

const { send } = require('micro');
const parse = require('urlencoded-body-parser');
const { readFile, writeFile } = require('fs-promise');

require('./outgoing');

const { WEBHOOK_URL, SLASH_TOKEN, ALLOWED_USER } = process.env;

const updateConfig = async (newConfig)  => {
  try {
    /*
    * get the current config
    */
    
    console.log('before reading');
    const rawConfig = await readFile('_config.json');
    const config = JSON.parse(rawConfig);
    
    console.log('after reading');
    
    
    /*
    * merge the current config with the new config
    */
    const mergedConfig = Object.assign({}, config, newConfig);
    
    /*
    * replace the previous config with a new config
    */
    console.log('before writing');
    await writeFile('_config.json', JSON.stringify(mergedConfig, null, 2));
    
    console.log('after writing');
    
    return mergedConfig;
  } catch(e) {
    console.error(e);
  }
};

/*
 * ow, missing an env variable!
 */
if (!WEBHOOK_URL || !SLASH_TOKEN || !ALLOWED_USER) {
  throw Error(`
    Missing one of the required environment variables! 😵
    Your config:
    - WEBHOOK_URL: ${WEBHOOK_URL}
    - SLASH_TOKEN: ${SLASH_TOKEN}
    - ALLOWED_USER: ${ALLOWED_USER}
  `);
}

/*
 * wrapper around micro to handle errors
 */
const handleErrors = fn => async (req, res) => {
  try {
    return await fn(req, res);
  } catch ({ stack = '...', statusCode = 500, message = 'No idea what 😵' }) {
    console.log(stack);
    send(res, statusCode, `Something went bad: ${message}`);
  }
}

/*
 * micro request handler
 */
module.exports = handleErrors(async (req, res) => {
  
  const { 'user-agent': userAgent, 'content-type': contentType } = req.headers
  
  /*
   * ping to keep alive? (see ./outgoing.js)
   */
  if (userAgent === 'micro-ping') { 
    
    return 'Ping pong!';
  
  /*
   * only accept urlencoded request
   */
  } else if (contentType !== 'application/x-www-form-urlencoded') {
    
    return 'This type of query is not allowed 😵';
  
  /*
   * process the possible slash command
   */
  } else {
    
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
    const canSendMessage = slackToken === SLASH_TOKEN && slackSender === ALLOWED_USER;
    if (!canSendMessage) {
      return {
        response_type: 'ephemeral',
        text: `Sorry, you can't do that.`,
      };
    }
    

    /*
     * somehow we want to reset the message counter
     */
    if (reset) { // note: should be done with some reset token from a slash command
      const response = await updateConfig({
        running: false,
        messageToSendIndex: 0,
      });
      
      return {
        response_type: 'ephemeral',
        text: `Messages reset.`,
      };
    }
    
    await updateConfig({
      running: true,
      messageToSendIndex: 0,
    });
     
     /*
     * respond with an object of the shape expected by Slack
     */
     return {
       response_type: 'ephemeral',
       text: `Bot started! :robot:`,
     };
  }
});
