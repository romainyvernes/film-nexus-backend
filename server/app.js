import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import 'dotenv/config';
import helmet from "helmet";
import passport from "passport";
import apiRouter from "./routes";
import { sanitizeDataInput } from "./middleware/sanitization";
import "./middleware/passport";

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
