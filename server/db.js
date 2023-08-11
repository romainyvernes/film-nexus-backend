import { Pool } from "pg";

const pool = new Pool({
  user: "postgres",
  host: "db",
  port: 5432,
  database: process.env.NODE_ENV === "test" ? "testing" : "filmnexus"
});

export default pool;
