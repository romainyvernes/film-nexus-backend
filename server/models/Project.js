import pool from "../db";

export const getProjects = async () => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM projects');
    return result.rows;
  } finally {
    client.release();
  }
};

export const getProjectById = async (id) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM projects WHERE id = $1', [id]);
    return result.rows[0];
  } finally {
    client.release();
  }
};

export const createProject = async (name) => {
  const client = await pool.connect();
  try {
    const result = await client.query('INSERT INTO projects (name) VALUES ($1) RETURNING *', [name]);
    return result.rows[0];
  } finally {
    client.release();
  }
};

export const updateProject = async (id, name) => {
  const client = await pool.connect();
  try {
    const result = await client.query('UPDATE projects SET name = $1 WHERE id = $2 RETURNING *', [name, id]);
    return result.rows[0];
  } finally {
    client.release();
  }
};

export const deleteProject = async (id) => {
  const client = await pool.connect();
  try {
    const result = await client.query('DELETE FROM projects WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  } finally {
    client.release();
  }
};
