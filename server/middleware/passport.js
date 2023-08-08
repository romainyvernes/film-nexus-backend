import FacebookStrategy from "passport-facebook";
import passport from "passport";
import config from "../config";
import { getUserById, upsertUser } from "../models/User";

passport.use(new FacebookStrategy({
    clientID: config.facebook.clientID,
    clientSecret: config.facebook.clientSecret,
    callbackURL: config.facebook.callbackURL,
    profileFields: ["name"],
  },
  async function(accessToken, refreshToken, profile, cb) {
    try {
      // retrieve user details or create new user in DB
      const user = await upsertUser(profile.id, {
        firstName: profile?.name?.givenName,
        lastName: profile?.name?.familyName,
      });
      return cb(null, user);
    } catch (error) {
      return cb(error);
    }
  }
));

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(async function (id, done) {
  const user = await getUserById(id);
  done(null, user);
});
