import pool from "../db";
import Joi from "joi";
import { formatKeysToSnakeCase, getFilteredFields, getQueryData } from "../utils/helpers";
import { baseSchema, updatedSchema } from "../validation/schemas/File";
import { userProps } from "./User";

const allowedFields = ["name", "url", "s3_file_key"];

export const fileProps = [
  "id",
  "name",
  "created_on",
  "url",
];

export const FILES_LIMIT = 15;

export const getFileById = async (id) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `
        SELECT
          files.*,
          json_build_object(
            ${userProps.map((prop) => `'${prop}', users.${prop}`).join(", ")}
          ) AS uploaded_by
        FROM files
          JOIN users ON files.creator_id = users.id
        WHERE files.id = $1
      `,
      [id]
    );
    return result.rows[0];
  } finally {
    client.release();
  }
};

export const getFilesByProjectId = async (projectId, offset = 0) => {
  const client = await pool.connect();
  try {
    const countQuery = `
      SELECT COUNT(*)
      FROM files
      WHERE project_id = $1
    `;
    const fileQuery = `
      SELECT
        files.*,
        json_build_object(
          ${userProps.map((prop) => `'${prop}', users.${prop}`).join(", ")}
        ) AS uploaded_by
      FROM files
        JOIN users ON files.creator_id = users.id
      WHERE files.project_id = $1
      ORDER BY files.created_on DESC
      OFFSET $2
      LIMIT $3
    `;
    const [countResult, fileResult] = await Promise.all([
      client.query(
        countQuery,
        [projectId]
      ),
      client.query(
        fileQuery,
        [projectId, offset, FILES_LIMIT]
      )
    ]);

    return {
      totalCount: countResult.rowCount,
      files: fileResult.rows,
      offset
    };
  } finally {
    client.release();
  }
};

export const createFile = async (creatorId, projectId, fields) => {
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
        INSERT INTO files (${["project_id", "creator_id", placeholders.columns].join(", ")})
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

export const updateFile = async(id, accessorId, fields) => {
  const { error, value } = updatedSchema.min(3).validate({
    id,
    accessorId,
    ...fields,
  });

  if (error) {
    throw new Error(error.details[0].message);
  }

  const filteredFields = getFilteredFields(
    formatKeysToSnakeCase(value),
    allowedFields
  );
  const { values, params } = getQueryData(filteredFields, true, 3);

  const client = await pool.connect();
  try {
    const result = await client.query(
      `
        UPDATE files
        SET ${params}
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
      [value.id, value.accessorId, ...values]
    );
    return result.rows[0];
  } finally {
    client.release();
  }
};

export const deleteFileById = async (id, accessorId) => {
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
        DELETE FROM files
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
      const file = await getFileById(value.id);
      if (file) {
        // condition implies accessor is not the file's creator or a project admin
        throw new Error("Access denied");
      } else {
        throw new Error("File not found");
      }
    }
    return result.rows[0];
  } finally {
    client.release();
  }
};

export const deleteFilesByProjectId = async (projectId, accessorId) => {
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
        DELETE FROM files
        WHERE project_id IN (
          SELECT project_id
          FROM project_members
          WHERE project_id = $1
            AND user_id = $2
            AND is_admin = true
        )
        RETURNING *
      `,
      [value.projectId, value.accessorId]
    );
    if (result.rows.length === 0) {
      const fileObj = await getFilesByProjectId(value.projectId);
      // confirms the absence of deleted files means one of the conditions
      // failed and not that no files were found
      if (fileObj.files.length > 0) {
        throw new Error("Access denied");
      }
    }
    return result.rows;
  } finally {
    client.release();
  }
};
