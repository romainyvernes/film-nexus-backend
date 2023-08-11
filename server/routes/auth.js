import { Router } from "express";
import passport from "passport";
import { handleFacebookAuth, handleLogout } from "../controllers/AuthController";

const router = Router();

router.get("/facebook",
  passport.authenticate("facebook")
);

router.get("/facebook/callback", handleFacebookAuth);

router.get("/logout", handleLogout);

export default router;
