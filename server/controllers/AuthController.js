import passport from "passport";
import { JWT_TOKEN_NAME, generateAuthToken } from "../middleware/jwt";

const LOGIN_PATH = "/login";

export const handleFacebookAuth = [
  passport.authenticate("facebook", { failureRedirect: LOGIN_PATH, session: false }),
  (req, res) => {
    const userId = req.user.id;
    const token = generateAuthToken(userId);
    res.cookie(
      JWT_TOKEN_NAME,
      token,
      { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 7 } // 7 days in milliseconds
    );
    res.redirect(`/api/users/${userId}`);
  }
];

export const handleLogout = (req, res) => {
  // clear token from client
  res.cookie(JWT_TOKEN_NAME, "", { httpOnly: true, expires: new Date(0) });
  res.redirect(LOGIN_PATH);
};
