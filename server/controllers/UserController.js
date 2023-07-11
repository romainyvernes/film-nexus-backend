import * as User from '../models/User';
import Joi from "joi";
import { baseSchema, updatedSchema } from "../validation/schemas/User";

export const getUsers = async (req, res) => {
  const { error, value } = baseSchema
    .append({
      projectId: Joi.string().uuid().required()
    })
    .fork(["username", "firstName", "lastName", "password"], (schema) => schema.optional())
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
  } = value;

  try {
    const users = await User.getUsers(
      projectId,
      userId,
      { username, firstName, lastName }
    );
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error retrieving user' });
  }
};

export const getUserById = async (req, res) => {
  const { error, value } = updatedSchema
    .fork(["currentPassword"], (schema) => schema.optional())
    .validate({ ...req.params });

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
    password,
  } = value;
  try {
    const user = await User.getUserByUsername(username);

    if (user) {
      return res.status(401).json({ message: "User already exists" });
    }

    const createdUser = await User.createUser(
      username,
      password,
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
    currentPassword,
    newPassword,
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
      currentPassword,
      {
        username,
        firstName,
        lastName,
        password: newPassword
      }
    );
    res.json(updatedUser);
  } catch (error) {
    let errorStatus;
    switch(error.message.toLowerCase()) {
      case "incorrect password":
        errorStatus = 403;
        break;
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

  const { id, currentPassword } = value;
  try {
    const deletedUser = await User.deleteUser(id, currentPassword);
    if (deletedUser) {
      res.sendStatus(200);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    let errorStatus;
    switch(error.message.toLowerCase()) {
      case "incorrect password":
        errorStatus = 403;
        break;
      case "user not found":
        errorStatus = 404;
        break;
      default:
        errorStatus = 500;
    }
    res.status(errorStatus).json({ message: error.message || 'Error deleting user' });
  }
};
