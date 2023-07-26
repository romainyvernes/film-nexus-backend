import * as File from "../models/File";
import * as Member from "../models/Member";
import Joi from "joi";
import { baseSchema, updatedSchema } from "../validation/schemas/File";
import { default as redis } from "../redis";

export const getFiles = async (req, res) => {
  const { error, value } = baseSchema
    .fork(["creatorId", "name", "url"], (schema) => schema.optional())
    .append({
      offset: Joi.number().optional()
    })
    .validate(
      {
        projectId: req.params.id,
        ...req.query
      },
      { allowUnknown: true }
    );

  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const {
    projectId,
    offset,
  } = value;
  const userId = req.userId;

  try {
    const accessor = await Member.getMember(projectId, userId);

    if (!accessor) {
      return res.status(401).json({ message: "Access denied" });
    }

    // TODO: store Files in redis

    const fileObj = await File.getFilesByProjectId(projectId, offset);
    res.json(fileObj);
  } catch(error) {
    res.status(500).json({ message: error.message || 'Error retrieving Files' });
  }
};

export const createFile = async (req, res) => {
  const { error, value } = baseSchema.validate(
    {
      projectId: req.params.id,
      creatorId: req.userId,
      ...req.body
    },
    { allowUnknown: true }
  );

  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const {
    projectId,
    creatorId,
    name,
    url,
  } = value;

  try {
    const accessor = await Member.getMember(projectId, creatorId);

    if (!accessor) {
      return res.status(401).json({ File: "Access denied" });
    }

    const createdFile = await File.createFile(
      creatorId,
      projectId,
      { name, url }
    );

    res.status(201).json(createdFile);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error creating File' });
  }
};

export const updateFile = async (req, res) => {
  const { error, value } = updatedSchema.validate(
    {
      accessorId: req.userId,
      id: req.params.fileId,
      ...req.body,
    },
    { allowUnknown: true }
  );

  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const {
    id: fileId,
    accessorId,
    name,
    url,
  } = value;

  try {
    const updatedFile = await File.updateFile(
      fileId,
      accessorId,
      { name, url }
    );

    res.status(201).json(updatedFile);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error creating File' });
  }
};

export const deleteFile = async (req, res) => {
  const { error, value } = updatedSchema.validate(
    {
      accessorId: req.userId,
      id: req.params.fileId,
    },
    { allowUnknown: true }
  );

  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const {
    id: fileId,
    accessorId,
  } = value;

  try {
    await File.deleteFileById(fileId, accessorId);
    res.sendStatus(200);
  } catch (error) {
    let errorStatus;
    switch(error.message.toLowerCase()) {
      case "access denied":
        errorStatus = 401;
        break;
      case "File not found":
        errorStatus = 404;
        break;
      default:
        errorStatus = 500;
    }
    res.status(errorStatus).json({ message: error.message || 'Error deleting File' });
  }
};
