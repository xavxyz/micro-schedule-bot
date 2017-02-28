const checkEnvironment = env => {
  /*
   * ow, missing an env variable!
   */
  if (!env.WEBHOOK_URL || !env.SLASH_TOKEN || !env.ALLOWED_USER) {
    throw Error(`
      Missing one of the required environment variables! 😵
      Your config:
      - WEBHOOK_URL: ${env.WEBHOOK_URL}
      - SLASH_TOKEN: ${env.SLASH_TOKEN}
      - ALLOWED_USER: ${env.ALLOWED_USER}
    `);
  }
};

const requestIsPing = req => req.headers['user-agent'] === 'micro-ping';

const requestIsUrlEncoded = req => req.headers['content-type'] === 'application/x-www-form-urlencoded';

module.exports = {
  checkEnvironment,
  requestIsPing,
  requestIsUrlEncoded,
};
