import fs from "fs";
import pool from "../../db";
import path from "path";

export function populateDb() {
  // Read the database.sql file
  const sql = fs.readFileSync(path.resolve(__dirname, "../../database.sql")).toString();
  return pool.query(sql);
}

export function clearDb() {
  // Drop all tables in the database
  return pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
}
