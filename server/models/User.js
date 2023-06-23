import pool from "../db";

export const getUserById = async (id) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
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
    const result = await client.query(
      'INSERT INTO users (username, first_name, last_name, password) VALUES ($1, $2, $3, $4) RETURNING *',
      [username, firstName, lastName, password]
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
  password,
) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'UPDATE users SET username = $1, first_name = $2, last_name = $3, password = $4 WHERE id = $5 RETURNING *',
      [username, firstName, lastName, password, id]
    );
    return result.rows[0];
  } finally {
    client.release();
  }
};

export const deleteUser = async (id) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'DELETE FROM users WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  } finally {
    client.release();
  }
};
