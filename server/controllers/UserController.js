import * as User from '../models/User';
import Joi from "joi";
import { baseSchema, updatedSchema } from "../validation/schemas/User";
import { default as redis } from "../redis";
import { DEFAULT_PAGE_NUMBER } from "../utils/helpers";

export const getUsers = async (req, res) => {
  const { error, value } = baseSchema
    .append({
      projectId: Joi.string().uuid().required(),
      page: Joi.number().optional(),
    })
    .fork(["username", "firstName", "lastName"], (schema) => schema.optional())
    .min(1)
    .validate({ ...req.body, ...req.query }, { allowUnknown: true });

  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const userId = req.userId;

  const {
    username,
    firstName,
    lastName,
    projectId,
    page,
  } = value;
  const paramsToSanitize = [username, firstName, lastName].filter((variable) => (
    variable !== undefined
  ));

  if (paramsToSanitize.length > 0 && !paramsToSanitize.join("").match(/^[A-Za-z1-9 ]+$/)) {
    return res.status(400).json({ message: "Special characters are not allowed" });
  }

  const pageNumber = page || DEFAULT_PAGE_NUMBER;
  const redisKey = `users:accessor:${userId}:project:${projectId}`;
  const redisSubKey = `
    page:${pageNumber}:search:${[username, firstName, lastName].join(",")}
  `;

  try {
    const storedResults = await redis.get(redisKey);
    let storedResultsAsJson = {};
    if (storedResults) {
      storedResultsAsJson = JSON.parse(storedResults);
      const storedUsersObj = storedResultsAsJson[redisSubKey];
      if (storedUsersObj) {
        return res.json(storedUsersObj);
      }
    }
    const usersObj = await User.getUsers(
      projectId,
      userId,
      {
        username,
        firstName,
        lastName,
      },
      pageNumber,
    );

    // save copy of search results in redis
    await redis.set(
      redisKey,
      JSON.stringify({
        ...storedResultsAsJson,
        [redisSubKey]: usersObj
      },
      "EX",
      5 * 60 // key expiration set to 5 minutes
    ));

    res.json(usersObj);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error retrieving user' });
  }
};

export const getUserById = async (req, res) => {
  const { error, value } = updatedSchema.validate({ ...req.params });

  if (error) {
    const { message } = error.details[0];
    if (message.includes("must be a valid GUID")) {
      return res.status(404).json({ message: "User not found" });
    } else {
      return res.status(400).json({ message });
    }
  }

  const { id } = value;

  try {
    const user = await User.getUserById(id);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error retrieving user' });
  }
};

export const createUser = async (req, res) => {
  const { error, value } = baseSchema.validate(req.body, { allowUnknown: true });

  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const {
    username,
    firstName,
    lastName,
  } = value;
  try {
    const user = await User.getUserByUsername(username);

    if (user) {
      return res.status(401).json({ message: "User already exists" });
    }

    const createdUser = await User.upsertUser(
      username,
      {
        firstName,
        lastName,
      }
    );
    res.status(201).json(createdUser);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error creating user' });
  }
};

export const updateUser = async (req, res) => {
  const { error, value } = updatedSchema.min(3).validate(
    { ...req.body, ...req.params },
    { allowUnknown: true }
  );

  if (error) {
    const { message } = error.details[0];
    if (message.includes("must be a valid GUID")) {
      return res.status(404).json({ message: "User not found" });
    } else {
      return res.status(400).json({ message });
    }
  }

  const {
    id,
    username,
    firstName,
    lastName,
  } = value;
  try {
    if (username) {
      const user = await User.getUserByUsername(username);
      if (user) {
        return res.status(401).json({ message: "Username already taken" });
      }
    }
    const updatedUser = await User.updateUser(
      id,
      {
        username,
        firstName,
        lastName,
      }
    );
    res.json(updatedUser);
  } catch (error) {
    let errorStatus;
    switch(error.message.toLowerCase()) {
      case "user not found":
        errorStatus = 404;
        break;
      default:
        errorStatus = 500;
    }
    res.status(errorStatus).json({ message: error.message || 'Error updating user' });
  }
};

export const deleteUser = async (req, res) => {
  const { error, value } = updatedSchema.validate(
    { ...req.body, ...req.params },
    { allowUnknown: true }
  );

  if (error) {
    const { message } = error.details[0];
    if (message.includes("must be a valid GUID")) {
      return res.status(404).json({ message: "User not found" });
    } else {
      return res.status(400).json({ message });
    }
  }

  const { id } = value;
  try {
    const deletedUser = await User.deleteUser(id);
    if (deletedUser) {
      res.sendStatus(200);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    let errorStatus;
    switch(error.message.toLowerCase()) {
      case "user not found":
        errorStatus = 404;
        break;
      default:
        errorStatus = 500;
    }
    res.status(errorStatus).json({ message: error.message || 'Error deleting user' });
  }
};
