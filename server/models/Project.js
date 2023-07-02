import Joi from "joi";
import pool from "../db";
import * as Member from "./Member";
import { formatKeysToSnakeCase, getFilteredFields, getQueryData } from "../utils/helpers";
import { userProps } from "./User";
import { baseSchema as projectBaseSchema, updatedSchema } from "../validation/schemas/Project";
import { baseSchema as memberBaseSchema } from "../validation/schemas/Member";

// Add additional modifiable fields as needed
const allowedFields = ["name"];
// Project object's desired properties
const projectPropsStr = [
  "id",
  "name",
  "created_on",
  "creator_id",
].map((prop) => `projects.${prop}`).join(", ");

export const getProjects = async (userId) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `
        SELECT ${projectPropsStr}
        FROM
          projects
          JOIN project_members ON projects.id = project_members.project_id
        WHERE project_members.user_id = $1
        ORDER BY projects.creator_id
      `,
      [userId]
    );
    return result.rows;
  } finally {
    client.release();
  }
};

export const getProjectById = async (projectId, userId) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `
        SELECT
          ${projectPropsStr},
          (
            SELECT
              json_agg(
                json_build_object(
                  ${userProps.map((prop) => `'${prop}', users.${prop}`).join(", ")}
                )
              )
            FROM
              project_members
              JOIN users ON project_members.user_id = users.id
            WHERE project_members.project_id = projects.id
          ) AS members,
          ${Member.memberProps.map((prop) => `pm.${prop}`).join(", ")}
        FROM
          projects
          LEFT JOIN project_members AS pm ON projects.id = pm.project_id
            AND pm.user_id = $1
        WHERE projects.id = $2
      `,
      [userId, projectId]
    );
    return result.rows[0];
  } finally {
    client.release();
  }
};

export const createProject = async (creatorId, projectFields, memberFields) => {
  const { error: projectError } = projectBaseSchema.validate({
    creatorId,
    ...projectFields
  });
  const { error: memberError } = memberBaseSchema
    .fork(["isAdmin", "projectId"], (schema) => schema.optional())
    .validate({
      userId: creatorId,
      ...memberFields
    });

  if (projectError) {
    throw new Error(projectError.details[0].message);
  }

  if (memberError) {
    throw new Error(memberError.details[0].message);
  }

  const filteredFields = getFilteredFields(
    formatKeysToSnakeCase(projectFields),
    allowedFields
  );
  const { values, placeholders } = getQueryData(filteredFields, false, 2);

  const client = await pool.connect();
  try {
    const result = await client.query(
      `
        INSERT INTO projects (${["creator_id", placeholders.columns].join(", ")})
        VALUES (${["$1", placeholders.values].join(", ")})
        RETURNING *
      `,
      [creatorId, ...values]
    );

    // Add project creator as a member of that project
    const projectId = result.rows[0].id;
    await Member.createMember(
      projectId,
      creatorId,
      {
        ...memberFields,
        isAdmin: true
      }
    );
    return result.rows[0];
  } finally {
    client.release();
  }
};

export const updateProject = async (projectId, userId, updateFields) => {
  const { error } = updatedSchema.validate({
    id: projectId,
    ...updateFields
  });

  if (error) {
    throw new Error(error.details[0].message);
  }

  const filteredFields = getFilteredFields(
    formatKeysToSnakeCase(updateFields),
    allowedFields
  );
  const { values, params } = getQueryData(filteredFields, true, 3);

  const client = await pool.connect();
  try {
    const result = await client.query(
      `
        UPDATE projects
        SET ${params}
        WHERE id = $1
          AND id = (
            SELECT project_id
            FROM project_members
            WHERE user_id = $2
              AND is_admin = true
              AND project_id = $1
          )
        RETURNING *
      `,
      [projectId, userId, ...values]
    );
    if (result.rows.length === 0) {
      throw new Error("Update failed");
    }
    return await getProjectById(projectId, userId);
  } finally {
    client.release();
  }
};

export const deleteProject = async (projectId, userId) => {
  const client = await pool.connect();
  try {
    const [{ rows: projectRows }, deletedMembers] = await Promise.all([
      client.query(
        `
          DELETE FROM projects
          WHERE id = $1
            AND id = (
              SELECT project_id
              FROM project_members
              WHERE user_id = $2
                AND is_admin = true
                AND project_id = $1
            )
          RETURNING *
        `,
        [projectId, userId]
      ),
      Member.deleteMembersByProjectId(projectId, userId),
    ]);
    if (projectRows.length === 0) {
      throw new Error("Deletion failed");
    }
    return {
      ...projectRows[0],
      members: deletedMembers
    };
  } finally {
    client.release();
  }
};
