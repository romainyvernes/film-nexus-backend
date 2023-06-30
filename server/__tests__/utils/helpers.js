import fs from "fs";
import pool from "../../db";
import path from "path";
import { getQueryData } from "../../utils/helpers";

export function populateDb() {
  // Read the database.sql file
  const sql = fs.readFileSync(path.resolve(__dirname, "../../database.sql")).toString();
  return pool.query(sql);
}

export function clearDb() {
  // Drop all tables in the database
  return pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
}

export async function queryDB(query, values) {
  const result = await pool.query(query, values);
  return result.rows[0];
}

export function addUser(userData) {
  const { placeholders, values } = getQueryData(userData);
  const query = `
    INSERT INTO users (${placeholders.columns})
    VALUES (${placeholders.values})
    RETURNING id, username, created_on, first_name, last_name
  `;
  return queryDB(query, values);
}

export function addProjectMember(memberData) {
  const { placeholders, values } = getQueryData(memberData);
  const query = `
    INSERT INTO project_members (${placeholders.columns})
    VALUES (${placeholders.values})
    RETURNING *
  `;
  return queryDB(query, values);
}
