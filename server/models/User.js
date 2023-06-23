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

export const updateUser = async (
  id,
  username,
  firstName,
  lastName,
  currentPassword,
  newPassword = null,
) => {
  const client = await pool.connect();
  try {
    const user = await getUserById(id);
    const isAuthenticated = await bcrypt.compare(currentPassword, user.password);

    if (isAuthenticated) {
      let result;
      if (newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        result = await client.query(
          `
            UPDATE users
            SET username = $1, first_name = $2, last_name = $3, password = $4
            WHERE id = $5
            RETURNING id, username, created_on, first_name, last_name
          `,
          [username, firstName, lastName, hashedPassword, id]
        );
      } else {
        result = await client.query(
          `
            UPDATE users
            SET username = $1, first_name = $2, last_name = $3
            WHERE id = $4
            RETURNING id, username, created_on, first_name, last_name
          `,
          [username, firstName, lastName, id]
        );
      }
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
