import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import 'dotenv/config'
import apiRouter from "./routes";
import { sanitizeDataInput } from "./middleware/sanitization";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(sanitizeDataInput);

app.use("/api", apiRouter);

export default app;
