import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import passport from "passport";
import apiRouter from "./routes";
import { sanitizeDataInput } from "./middleware/sanitization";
import "./middleware/passport";

// Load environment variables based on the current environment
if (process.env.NODE_ENV === "production") {
  dotenv.config({ path: ".env.prod" });
} else {
  dotenv.config({ path: ".env.local" });
}

const app = express();

app.use(passport.initialize());
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(sanitizeDataInput);

app.use("/api", apiRouter);

export default app;
