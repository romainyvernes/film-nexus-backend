import { default as redis } from "../../redis";
import pool from "../../db";
import { clearDb } from "../utils/helpers";

export default async () => {
  // remove test data from Redis and Postgres
  await Promise.all([
    redis.flushdb(),
    clearDb()
  ]);

  // end Postgres connection
  await pool.end();
};
