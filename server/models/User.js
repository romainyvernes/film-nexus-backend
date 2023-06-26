import bcrypt from "bcrypt";
import pool from "../db";

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
        SELECT id, username, created_on, first_name, last_name
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
  firstName,
  lastName,
  password,
) => {
  const client = await pool.connect();
  try {
    const user = await getUserByUsername(username);
    if (user) {
      throw new Error("User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const result = await client.query(
      `
        INSERT INTO users (username, first_name, last_name, password)
        VALUES ($1, $2, $3, $4)
        RETURNING id, username, created_on, first_name, last_name
      `,
      [username, firstName, lastName, hashedPassword]
    );
    return result.rows[0];
  } finally {
    client.release();
  }
};

export const updateUser = async (id, currentPassword, updatedFields) => {
  const client = await pool.connect();
  try {
    const user = await getUserById(id);
    const isAuthenticated = await bcrypt.compare(currentPassword, user.password);

    if (isAuthenticated) {
      const fieldsToUpdate = {...updatedFields};
      if (fieldsToUpdate.password) {
        fieldsToUpdate.password = await bcrypt.hash(fieldsToUpdate.password, saltRounds);
      }
      const updateColumns = Object.keys(fieldsToUpdate);
      if (updateColumns.length === 0) {
        throw new Error("At least one updated value is required");
      }
      const updateValues = Object.values(fieldsToUpdate);
      const updateParams = updateColumns.map((col, index) => `${col} = $${index + 2}`);
      const result = await client.query(
        `
          UPDATE users
          SET ${updateParams.join(", ")}
          WHERE id = $1
          RETURNING id, username, created_on, first_name, last_name
        `,
        [id, ...updateValues]
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
      const result = await client.query(
        `
          DELETE FROM users
          WHERE id = $1
          RETURNING id, username, created_on, first_name, last_name
        `,
        [id]
      );
      return result.rows[0];
    } else {
      throw new Error("Incorrect password");
    }
  } finally {
    client.release();
  }
};
