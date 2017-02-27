const { send } = require('micro');
const parse = require('urlencoded-body-parser');
const rp = require('request-promise');
const fs = require('fs');

const { WEBHOOK_URL, SLASH_TOKEN, ALLOWED_USER } = process.env;

if (!WEBHOOK_URL || !SLASH_TOKEN || !ALLOWED_USER) {
  throw Error(`
    Missing one of the required environment variables! 😵
    Your config:
    - WEBHOOK_URL: ${WEBHOOK_URL}
    - SLASH_TOKEN: ${SLASH_TOKEN}
    - ALLOWED_USER: ${ALLOWED_USER}
  `);
}

const handleErrors = fn => async (req, res) => {
  try {
    return await fn(req, res);
  } catch ({ stack = '...', statusCode = 500, message = 'No idea what 😵' }) {
    console.log(stack);
    send(res, statusCode, `Something went bad: ${message}`);
  }
}

// the current message to send, start at 0
let messageToSendIndex = 0;

module.exports = handleErrors(async (req, res) => {
  
  const { 'user-agent': userAgent, 'content-type': contentType } = req.headers
  
  /*
   * ping to keep alive? (see end of this file)
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
    
    const slashCommand = await parse(req);
    
    if (slashCommand.token !== SLASH_TOKEN 
      || slashCommand.user_name !== ALLOWED_USER
    ) {
      return {
        response_type: 'ephemeral',
        text: `Sorry, that didn\'t work.`,
      };
    }
    
    const config = fs.readFileSync('_config.json');
    const { username, icon_url, messages } = JSON.parse(config);
    
    const messageObject = messages[messageToSendIndex];
    
    // find a way to enable object spread operator with micro 
    send(res, 200, Object.assign({}, messageObject, {
      username,
      icon_url,
      response_type: 'in_channel',
      response_url: slashCommand.response_url,
    }));
    
    messageToSendIndex++;
    
    // to move the job scheduler
    // const slackMessage = await rp({
    //   uri: WEBHOOK_URL,
    //   method: 'POST',
    //   body: Object.assign({}, messageObject, {
    //     username,
    //     icon_url,
    //   }),
    //   json: true,
    // });
  }
  
});

// hack to ping every 5mins to keep server alive
setInterval(() => {
  const pingConfig = {
    headers: { 'user-agent': 'micro-ping' },
    json: true,
  };
  
  rp(process.env.ROOT_URL || 'http://localhost:3000', pingConfig)
    .then((res) => console.log(res))
    .catch((err) => console.error('ping failed', err.message));
}, 300000);
