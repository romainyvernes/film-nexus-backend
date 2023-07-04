import fs from "fs";
import pool from "../../db";
import path from "path";
import bcrypt from "bcrypt";
import { formatKeysToSnakeCase, getQueryData } from "../../utils/helpers";
import { saltRounds } from "../../models/User";

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

export async function addUser(userData) {
  const data = formatKeysToSnakeCase(userData);
  data.password = await bcrypt.hash(data.password, saltRounds);
  const { placeholders, values } = getQueryData(data);
  const query = `
    INSERT INTO users (${placeholders.columns})
    VALUES (${placeholders.values})
    RETURNING id, username, created_on, first_name, last_name
  `;
  return queryDB(query, values);
}

export function addProject(projectData) {
  const { placeholders, values } = getQueryData((formatKeysToSnakeCase(projectData)));
  const query = `
    INSERT INTO projects (${placeholders.columns})
    VALUES (${placeholders.values})
    RETURNING *
  `;
  return queryDB(query, values);
}

export function addProjectMember(memberData) {
  const { placeholders, values } = getQueryData(formatKeysToSnakeCase(memberData));
  const query = `
    INSERT INTO project_members (${placeholders.columns})
    VALUES (${placeholders.values})
    RETURNING *
  `;
  return queryDB(query, values);
}
