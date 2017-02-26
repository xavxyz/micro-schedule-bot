const { send } = require('micro');
const rp = require('request-promise');
const fs = require('fs');

const { WEBHOOK_URL } = process.env;

const handleErrors = fn => async (req, res) => {
  try {
    return await fn(req, res);
  } catch (err) {
    console.log(err.stack)
    send(res, 500, 'Something went bad...');
  }
}

module.exports = handleErrors(async (req, res) => {
  const config = fs.readFileSync('_config.json');
  const { username, icon_url, text } = JSON.parse(config);
  
  const response = await rp({
    uri: WEBHOOK_URL,
    method: 'POST',
    body: {
      text,
      username,
      icon_url,
    },
    json: true,
  });
  
  return response;
});
