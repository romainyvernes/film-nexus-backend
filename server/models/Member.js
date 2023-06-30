import Joi from "joi";
import pool from "../db";
import { getFilteredFields, getQueryData } from "../utils/helpers";

// Add additional modifiable fields as needed
const allowedFields = ["position", "is_admin"];
// Member object's desired properties
export const memberProps = [
  "position",
  "is_admin",
];

export const createMember = async (projectId, userId, fields) => {
  const schema = Joi.object({
    project_id: Joi.string().uuid().required(),
    user_id: Joi.string().uuid().required(),
    position: Joi.string().required(),
    is_admin: Joi.boolean().required(),
  });

  const { error, value } = schema.validate({
    project_id: projectId,
    user_id: userId,
    ...fields,
  });

  if (error) {
    throw new Error(error.details[0].message);
  }

  const filteredFields = getFilteredFields(fields, allowedFields);
  const { values, placeholders } = getQueryData(filteredFields, false, 3);

  const client = await pool.connect();
  try {
    const result = await client.query(
      `
        INSERT INTO project_members (${["project_id", "user_id", placeholders.columns].join(", ")})
        VALUES (${["$1", "$2", placeholders.values].join(", ")})
        RETURNING *
      `,
      [projectId, userId, ...values]
    );
    return result.rows[0];
  } finally {
    client.release();
  }
};

export const updateMember = async (projectId, userId, accessorId, updateFields) => {
  const schema = Joi.object({
    position: Joi.string(),
    is_admin: Joi.boolean(),
  }).min(1);

  const { error } = schema.validate(updateFields);

  if (error) {
    throw new Error(error.details[0].message);
  }

  const filteredFields = getFilteredFields(updateFields, allowedFields);
  const { values, params } = getQueryData(filteredFields, true, 4);

  const client = await pool.connect();
  try {
    const result = await client.query(
      `
        UPDATE project_members
        SET ${params}
        WHERE project_id = $1
          AND user_id = $2
          AND project_id = (
            SELECT project_id
            FROM project_members
            WHERE project_id = $1
              AND user_id = $3
              AND is_admin = true
          )
        RETURNING *
      `,
      [projectId, userId, accessorId, ...values]
    );
    if (result.rows.length === 0) {
      throw new Error("Update failed");
    }
    return result.rows[0];
  } finally {
    client.release();
  }
};

export const deleteMemberById = async (projectId, memberId, accessorId) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `
        DELETE FROM project_members
        WHERE user_id = $1
          AND project_id = $2
          AND project_id = (
            SELECT project_id
            FROM project_members
            WHERE user_id = $3
              AND project_id = $2
              AND is_admin = true
          )
        RETURNING *
      `,
      [memberId, projectId, accessorId]
    );
    if (result.rows.length === 0) {
      throw new Error("Deletion failed");
    }
    return result.rows[0];
  } finally {
    client.release();
  }
};

export const deleteMembersByProjectId = async (projectId, accessorId) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `
        DELETE FROM project_members
        WHERE project_id = $1
          AND project_id = (
            SELECT project_id
            FROM project_members
            WHERE project_id = $1
              AND user_id = $2
              AND is_admin = true
          )
        RETURNING *
      `,
      [projectId, accessorId]
    );
    if (result.rows.length === 0) {
      throw new Error("Deletion failed");
    }
    return result.rows;
  } finally {
    client.release();
  }
};
