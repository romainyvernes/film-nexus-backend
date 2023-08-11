import { Pool } from "pg";
import config from "./config";

const pool = new Pool({
  user: config.postgres.user,
  host: config.postgres.host,
  password: config.postgres.password,
  port: 5432,
  database: process.env.NODE_ENV === "test" ? "testing" : "filmnexus"
});

export default pool;
