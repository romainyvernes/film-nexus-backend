import bcrypt from "bcrypt";
import pool from "../db";
import _ from "lodash";
import { formatKeysToSnakeCase, getFilteredFields, getQueryData, getQueryOffset } from "../utils/helpers";
import { baseSchema, updatedSchema } from "../validation/schemas/User";

const USERS_LIMIT = 10;

// Add additional modifiable fields as needed
const allowedFields = ["username", "first_name", "last_name", "password"];

// User object's desired properties
export const userProps = [
  "id",
  "username",
  "created_on",
  "first_name",
  "last_name",
];
const userPropsStr = userProps.join(", ");
export const saltRounds = 10;

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

export const getUserById = async (id, withPassword = false) => {
  const { error, value } = updatedSchema
    .fork(["currentPassword"], (schema) => schema.optional())
    .validate({ id });

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
    if (withPassword || !result.rows[0]) {
      return result.rows[0];
    }
    const { password, ...sanitizedUser } = result.rows[0];
    return sanitizedUser;
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

export const createUser = async (
  username,
  password,
  fields,
) => {
  const { error, value } = baseSchema.validate({ username, password, ...fields });

  if (error) {
    throw new Error(error.details[0].message);
  }

  const client = await pool.connect();
  try {
    const hashedPassword = await bcrypt.hash(value.password, saltRounds);
    const excludedFields = ["username", "password"];
    const filteredFields = getFilteredFields(
      formatKeysToSnakeCase(value),
      allowedFields,
      excludedFields
    );
    const { values, placeholders } = getQueryData(filteredFields, false, 3);
    const result = await client.query(
      `
        INSERT INTO users (${["username", "password", placeholders.columns].join(", ")})
        VALUES (${["$1", "$2", placeholders.values].join(", ")})
        RETURNING ${userPropsStr}
      `,
      [value.username, hashedPassword, ...values]
    );
    return result.rows[0];
  } finally {
    client.release();
  }
};

export const updateUser = async (id, currentPassword, updateFields) => {
  const { error, value } = updatedSchema.min(3).validate({
    id,
    currentPassword,
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
    const isAuthenticated = await bcrypt.compare(value.currentPassword, user.password);

    if (isAuthenticated) {
      let fieldsToUpdate = { ...value };
      if (fieldsToUpdate.password) {
        fieldsToUpdate.password = await bcrypt.hash(fieldsToUpdate.password, saltRounds);
      }
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
    } else {
      throw new Error("Incorrect password");
    }
  } finally {
    client.release();
  }
};

export const deleteUser = async (id, currentPassword) => {
  const { error, value } = updatedSchema.validate({
    id,
    currentPassword,
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
    const isAuthenticated = await bcrypt.compare(value.currentPassword, user.password);
    if (isAuthenticated) {
      const result = await client.query(
        `DELETE FROM users WHERE id = $1 RETURNING ${userPropsStr}`,
        [value.id]
      );
      return result.rows[0];
    } else {
      throw new Error("Incorrect password");
    }
  } finally {
    client.release();
  }
};
