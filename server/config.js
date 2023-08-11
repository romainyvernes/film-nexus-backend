export default {
  facebook: {
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: `${process.env.SITE_ROOT_URL}${process.env.FACEBOOK_REDIRECT_PATH}`,
  },
  postgres: {
    host: process.env.POSTGRES_HOST,
    password: process.env.POSTGRES_PW,
    user: process.env.POSTGRES_USER,
  },
  redis: {
    host: process.env.REDIS_HOST,
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PW,
  },
};
