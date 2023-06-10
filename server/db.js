import { Pool } from "pg";

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  port: 5432,
  database: "filmnexus"
});

export default pool;
