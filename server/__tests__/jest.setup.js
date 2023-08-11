import { populateDb } from "./utils/helpers";
import { default as redis } from "../redis";
import pool from "../db";
import { clearDb } from "./utils/helpers";

export const setup = async () => {
  await populateDb();
};

export const cleanup = async () => {
  // remove test data from Redis and Postgres
  await Promise.all([
    redis.flushdb(),
    clearDb()
  ]);

  // end Postgres connection
  await pool.end();
};

beforeAll(async () => {
  await setup();
});

afterAll(async () => {
  await cleanup();
});
