import pool from "../db";
import _ from "lodash";
import { formatKeysToSnakeCase, getFilteredFields, getQueryData, getQueryOffset } from "../utils/helpers";
import { baseSchema, updatedSchema } from "../validation/schemas/User";

const USERS_LIMIT = 10;

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

// search for users, excluding current user and users already in project
export const getUsers = async (projectId, accessorId, searchParams = {}, pageNumber = 1) => {
  const client = await pool.connect();
  try {
    let usersQuery = `
      SELECT ${userPropsStr}
      FROM users
      WHERE id <> '${accessorId}'
      AND id NOT IN (
        SELECT user_id
        FROM project_members
        WHERE project_id = '${projectId}'
      )
    `;
    const countQuery = usersQuery;

    if (!_.isEmpty(searchParams)) {
      const keys = Object
        .keys(searchParams)
        .filter((key) => searchParams[key] !== undefined);
      if (keys.length > 0) {
        const searchStr = keys
          .map((param) => (
            `${_.snakeCase(param).toLowerCase()} ILIKE '%${searchParams[param]}%'`
          ))
          .join(" OR ");
        usersQuery += ` AND (${searchStr})`;
      }
    }
    const offset = getQueryOffset(pageNumber, USERS_LIMIT);
    usersQuery += ` ORDER BY last_name OFFSET ${offset} LIMIT ${USERS_LIMIT}`;

    const [usersResult, countResult] = await Promise.all([
      client.query(usersQuery),
      client.query(countQuery)
    ]);

    return {
      page: pageNumber,
      users: usersResult.rows,
      totalCount: countResult.rowCount
    };
  } finally {
    client.release();
  }
};

export const getUserById = async (id) => {
  const { error, value } = updatedSchema.validate({ id });

  if (error) {
    throw new Error(error.details[0].message);
  }

  const client = await pool.connect();
  try {
    const result = await client.query(
      `
        SELECT *
        FROM users
        WHERE id = $1
      `,
      [value.id]
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

export const upsertUser = async (
  username,
  fields,
) => {
  const { error, value } = baseSchema.validate({ username, ...fields });

  if (error) {
    throw new Error(error.details[0].message);
  }

  const client = await pool.connect();
  try {
    const excludedFields = ["username"];
    const filteredFields = getFilteredFields(
      formatKeysToSnakeCase(value),
      allowedFields,
      excludedFields
    );
    const { values, placeholders } = getQueryData(filteredFields, false, 2);
    const result = await client.query(
      `
        INSERT INTO users (${["username", placeholders.columns].join(", ")})
        VALUES (${["$1", placeholders.values].join(", ")})
        ON CONFLICT (username) DO UPDATE SET
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name
        RETURNING ${userPropsStr}
      `,
      [value.username, ...values]
    );
    return result.rows[0];
  } finally {
    client.release();
  }
};

export const updateUser = async (id, updateFields) => {
  const { error, value } = updatedSchema.min(3).validate({
    id,
    ...updateFields
  });

  if (error) {
    throw new Error(error.details[0].message);
  }

  const client = await pool.connect();
  try {
    const user = await getUserById(value.id, true);
    if (!user) {
      throw new Error("User not found");
    }

    let fieldsToUpdate = { ...value };
    fieldsToUpdate = getFilteredFields(
      formatKeysToSnakeCase(fieldsToUpdate),
      allowedFields
    );
    const { values, params } = getQueryData(fieldsToUpdate, true, 2);

    const result = await client.query(
      `
        UPDATE users
        SET ${params}
        WHERE id = $1
        RETURNING ${userPropsStr}
      `,
      [value.id, ...values]
    );
    return result.rows[0];
  } finally {
    client.release();
  }
};

export const deleteUser = async (id) => {
  const { error, value } = updatedSchema.validate({ id });

  if (error) {
    throw new Error(error.details[0].message);
  }

  const client = await pool.connect();
  try {
    const user = await getUserById(value.id, true);
    if (!user) {
      throw new Error("User not found");
    }
    const result = await client.query(
      `DELETE FROM users WHERE id = $1 RETURNING ${userPropsStr}`,
      [value.id]
    );
    return result.rows[0];
  } finally {
    client.release();
  }
};
