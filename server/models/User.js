import bcrypt from "bcrypt";
import Joi from "joi";
import pool from "../db";
import { getFilteredFields, getQueryData } from "../utils/helpers";

// Add additional modifiable fields as needed
const allowedFields = ["username", "first_name", "last_name"];

// User object's desired properties
export const userProps = [
  "id",
  "username",
  "created_on",
  "first_name",
  "last_name",
];
const userPropsStr = userProps.join(", ");
const saltRounds = 10;

export const getUserById = async (id) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `
        SELECT *
        FROM users
        WHERE id = $1
      `,
      [id]
    );
    return result.rows[0];
  } finally {
    client.release();
  }
};

export const getUserByUsername = async (username) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `
        SELECT ${userPropsStr}
        FROM users
        WHERE username = $1
      `,
      [username]
    );
    return result.rows[0];
  } finally {
    client.release();
  }
};

export const createUser = async (
  username,
  password,
  fields,
) => {
  const schema = Joi.object({
    username: Joi.string().required().min(3).max(20),
    first_name: Joi.string().required(),
    last_name: Joi.string().required(),
    password: Joi.string().required().min(6),
  });

  const { error } = schema.validate({ username, password, ...fields });

  if (error) {
    throw new Error(error.details[0].message);
  }

  const client = await pool.connect();
  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const excludedFields = ["username"];
    const filteredFields = getFilteredFields(fields, allowedFields, excludedFields);
    const { values, placeholders } = getQueryData(filteredFields, false, 3);
    const result = await client.query(
      `
        INSERT INTO users (${["username", "password", placeholders.columns].join(", ")})
        VALUES (${["$1", "$2", placeholders.values].join(", ")})
        RETURNING ${userPropsStr}
      `,
      [username, hashedPassword, ...values]
    );
    return result.rows[0];
  } finally {
    client.release();
  }
};

export const updateUser = async (id, currentPassword, updateFields) => {
  const schema = Joi.object({
    username: Joi.string().min(3).max(20),
    first_name: Joi.string(),
    last_name: Joi.string(),
    password: Joi.string().min(6),
  }).min(1);

  const { error } = schema.validate(updateFields);

  if (error) {
    throw new Error(error.details[0].message);
  }

  const client = await pool.connect();
  try {
    const user = await getUserById(id);
    const isAuthenticated = await bcrypt.compare(currentPassword, user.password);

    if (isAuthenticated) {
      const fieldsToUpdate = {...updateFields};
      if (fieldsToUpdate.password) {
        fieldsToUpdate.password = await bcrypt.hash(fieldsToUpdate.password, saltRounds);
      }
      const { values, params } = getQueryData(fieldsToUpdate, true, 2);

      const result = await client.query(
        `
          UPDATE users
          SET ${params}
          WHERE id = $1
          RETURNING ${userPropsStr}
        `,
        [id, ...values]
      );
      return result.rows[0];
    } else {
      throw new Error("Incorrect password");
    }
  } finally {
    client.release();
  }
};

export const deleteUser = async (id, currentPassword) => {
  const client = await pool.connect();
  try {
    const user = await getUserById(id);
    const isAuthenticated = await bcrypt.compare(currentPassword, user.password);
    if (isAuthenticated) {
      const [{ rows: userRows }, ] = await Promise.all([
        client.query(`DELETE FROM users WHERE id = $1 RETURNING ${userPropsStr}`, [id]),
        client.query("DELETE FROM project_members WHERE user_id = $1", [id])
      ]);
      return userRows[0];
    } else {
      throw new Error("Incorrect password");
    }
  } finally {
    client.release();
  }
};
