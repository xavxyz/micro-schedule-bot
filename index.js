const { send } = require('micro');
const parse = require('urlencoded-body-parser');
const rp = require('request-promise');
const fs = require('fs');

const { WEBHOOK_URL, SLASH_TOKEN, ALLOWED_USER } = process.env;

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
  
  const slashCommand = await parse(req);
  
  if (!slashCommand 
      || slashCommand.token !== SLASH_TOKEN 
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
  
  send(res, 200, Object.assign({}, messageObject, {
    username,
    icon_url,
    response_type: 'ephemeral',
  });
  
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
});
