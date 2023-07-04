import bcrypt from "bcrypt";
import Joi from "joi";
import pool from "../db";
import { formatKeysToSnakeCase, getFilteredFields, getQueryData } from "../utils/helpers";
import { baseSchema, updatedSchema } from "../validation/schemas/User";

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
export const saltRounds = 10;

export const getUserById = async (id, withPassword = false) => {
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
    if (withPassword) {
      return result.rows[0];
    }
    const { password, ...sanitizedUser } = result.rows[0];
    return sanitizedUser;
  } catch(err) {
    // invalid ID type is akin to not finding the user
    if (err.message.includes("invalid input syntax for type uuid")) {
      return undefined;
    }
    throw err;
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
  const { error } = baseSchema.validate({ username, password, ...fields });

  if (error) {
    throw new Error(error.details[0].message);
  }

  const client = await pool.connect();
  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const excludedFields = ["username"];
    const filteredFields = getFilteredFields(
      formatKeysToSnakeCase(fields),
      allowedFields,
      excludedFields
    );
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
  const { error } = updatedSchema.validate({
    id,
    currentPassword,
    ...updateFields
  });

  if (error) {
    throw new Error(error.details[0].message);
  }

  const client = await pool.connect();
  try {
    const user = await getUserById(id, true);
    if (!user) {
      throw new Error("User not found");
    }
    const isAuthenticated = await bcrypt.compare(currentPassword, user.password);

    if (isAuthenticated) {
      let fieldsToUpdate = {...updateFields};
      if (fieldsToUpdate.password) {
        fieldsToUpdate.password = await bcrypt.hash(fieldsToUpdate.password, saltRounds);
      }
      fieldsToUpdate = formatKeysToSnakeCase(fieldsToUpdate);
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
    const user = await getUserById(id, true);
    if (!user) {
      throw new Error("User not found");
    }
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
