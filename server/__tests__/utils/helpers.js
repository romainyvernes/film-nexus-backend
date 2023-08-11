import fs from "fs";
import pool from "../../db";
import path from "path";
import { formatKeysToSnakeCase, getQueryData } from "../../utils/helpers";

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

export function addItemIntoDb (tableName, data, returnedColumns = "*") {
  const { placeholders, values } = getQueryData((formatKeysToSnakeCase(data)));
  const query = `
    INSERT INTO ${tableName} (${placeholders.columns})
    VALUES (${placeholders.values})
    RETURNING ${returnedColumns}
  `;
  return queryDB(query, values);
}

export async function addUser(userData) {
  return addItemIntoDb('users', userData, "id, username, created_on, first_name, last_name");
}

export function addProject(projectData) {
  return addItemIntoDb('projects', projectData);
}

export function addProjectMember(memberData) {
  return addItemIntoDb('project_members', memberData);
}
