import pool from "../db";
import * as Project from "./Project";
import { formatKeysToSnakeCase, getFilteredFields, getQueryData } from "../utils/helpers";
import { baseSchema, updatedSchema } from "../validation/schemas/Member";

// Add additional modifiable fields as needed
const allowedFields = ["position", "is_admin"];
// Member object's desired properties
export const memberProps = [
  "position",
  "is_admin",
];

export const getMember = async (projectId, userId) => {
  const { error } = baseSchema
    .fork(["position", "isAdmin"], (schema) => schema.optional())
    .validate({
      projectId,
      userId,
    });

  if (error) {
    throw new Error(error.details[0].message);
  }

  const client = await pool.connect();
  try {
    const result = await client.query(
      `
        SELECT *
        FROM project_members
        WHERE project_id = $1 AND user_id = $2
      `,
      [projectId, userId]
    );
    return result.rows[0];
  } finally {
    client.release();
  }
};

export const createMember = async (projectId, userId, fields) => {
  const { error } = baseSchema.validate({
    projectId,
    userId,
    ...fields,
  });

  if (error) {
    throw new Error(error.details[0].message);
  }

  const filteredFields = getFilteredFields(
    formatKeysToSnakeCase(fields),
    allowedFields
  );
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
  const { error } = updatedSchema.validate({
    projectId,
    userId,
    accessorId,
    ...updateFields
  });

  if (error) {
    throw new Error(error.details[0].message);
  }

  const filteredFields = getFilteredFields(
    formatKeysToSnakeCase(updateFields),
    allowedFields
  );
  const { values, params } = getQueryData(filteredFields, true, 4);

  if (values.length === 0) {
    throw new Error("At least one update is required");
  }

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
      const project = await Project.getProjectById(projectId);
      if (project) {
        throw new Error("Access denied");
      } else {
        throw new Error("Project not found");
      }
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
      const project = await Project.getProjectById(projectId);
      if (project) {
        throw new Error("Access denied");
      } else {
        throw new Error("Project not found");
      }
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
      const project = await Project.getProjectById(projectId);
      if (project) {
        throw new Error("Access denied");
      } else {
        throw new Error("Project not found");
      }
    }
    return result.rows;
  } finally {
    client.release();
  }
};
