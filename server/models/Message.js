import pool from "../db";
import Joi from "joi";
import { formatKeysToSnakeCase, getFilteredFields, getQueryData } from "../utils/helpers";
import { baseSchema, updatedSchema } from "../validation/schemas/Message";

const allowedFields = ["text"];

const MESSAGES_LIMIT = 15;

export const getMessageById = async (id) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `
        SELECT *
        FROM messages
        WHERE id = $1
      `,
      [id]
    );
    return result.rows[0];
  } finally {
    client.release();
  }
};

export const getMessagesByProjectId = async (projectId, offset = 0) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `
        SELECT *
        FROM messages
        WHERE project_id = $1
        OFFSET $2
        LIMIT $3
      `,
      [projectId, offset, MESSAGES_LIMIT]
    );
    return result.rows;
  } finally {
    client.release();
  }
};

export const createMessage = async (creatorId, projectId, fields) => {
  const { error, value } = baseSchema.validate({
    projectId,
    creatorId,
    ...fields,
  });

  if (error) {
    throw new Error(error.details[0].message);
  }

  const filteredFields = getFilteredFields(
    formatKeysToSnakeCase(value),
    allowedFields
  );
  const { values, placeholders } = getQueryData(filteredFields, false, 3);

  const client = await pool.connect();
  try {
    const result = await client.query(
      `
        INSERT INTO messages (${["project_id", "creator_id", placeholders.columns].join(", ")})
        VALUES (${["$1", "$2", placeholders.values].join(", ")})
        RETURNING *
      `,
      [value.projectId, value.creatorId, ...values]
    );
    return result.rows[0];
  } finally {
    client.release();
  }
};

export const deleteMessageById = async (id, accessorId) => {
  const { error, value } = updatedSchema.validate({
    id,
    accessorId,
  });

  if (error) {
    throw new Error(error.details[0].message);
  }

  const client = await pool.connect();
  try {
    const result = await client.query(
      `
        DELETE FROM messages
        WHERE id = $1
          AND (
            creator_id = $2
              OR project_id IN (
                SELECT project_id
                FROM project_members
                WHERE user_id = $2
                  AND is_admin = true
              )
          )
        RETURNING *
      `,
      [value.id, value.accessorId]
    );
    if (result.rows.length === 0) {
      const message = await getMessageById(value.id);
      if (message) {
        // condition implies accessor is not the message's creator or a project admin
        throw new Error("Access denied");
      } else {
        throw new Error("Message not found");
      }
    }
    return result.rows[0];
  } finally {
    client.release();
  }
};

export const deleteMessagesByProjectId = async (projectId, accessorId) => {
  const { error, value } = updatedSchema
    .fork(["id"], (schema) => schema.optional())
    .append({
      projectId: Joi.string().uuid().required()
    })
    .validate({
      accessorId,
      projectId,
    });

  if (error) {
    throw new Error(error.details[0].message);
  }

  const client = await pool.connect();
  try {
    const result = await client.query(
      `
        DELETE FROM messages
        WHERE project_id = $1
          AND project_id IN (
            SELECT project_id
            FROM project_members
            WHERE user_id = $2
              AND is_admin = true
          )
        RETURNING *
      `,
      [value.projectId, value.accessorId]
    );
    if (result.rows.length === 0) {
      const messages = await getMessagesByProjectId(value.projectId);
      // confirms the absence of deleted messages means one of the conditions
      // failed and not that no messages were found
      if (messages.length > 0) {
        throw new Error("Access denied");
      }
    }
    return result.rows;
  } finally {
    client.release();
  }
};
