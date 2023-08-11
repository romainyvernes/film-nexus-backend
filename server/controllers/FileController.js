import * as File from "../models/File";
import * as Member from "../models/Member";
import Joi from "joi";
import { baseSchema, updatedSchema } from "../validation/schemas/File";
import { default as redis } from "../redis";
import { deleteFileFromS3 } from "../middleware/fileUpload";
import { formatDataForSortedSet } from "../utils/helpers";

// expiration time in Redis
const FILE_TTL = 60 * 5; // 5 minutes

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

  let {
    projectId,
    offset,
  } = value;
  const userId = req.userId;
  const fileRedisKey = `projects:${projectId}:files`;
  const countRedisKey = `${fileRedisKey}:count`;
  offset = offset || 0;

  try {
    const accessor = await Member.getMember(projectId, userId);

    if (!accessor) {
      return res.status(401).json({ message: "Access denied" });
    }

    const endValue = offset + File.FILES_LIMIT;
    const [storedResults, totalCount] = await Promise.all([
      redis.zrangebyscore(fileRedisKey, offset, endValue),
      redis.get(countRedisKey)
    ]);
    const expectedCount = endValue - offset;

    if (storedResults.length === expectedCount) {
      return res.json({
        totalCount,
        files: storedResults.map((result) => JSON.parse(result)),
        offset
      });
    }

    const fileObj = await File.getFilesByProjectId(projectId, offset);
    const formattedMessages = formatDataForSortedSet(fileObj.files, offset);

    await Promise.all([
      redis.zadd(fileRedisKey, ...formattedMessages),
      redis.set(countRedisKey, fileObj.totalCount, "EX", 5 * 60)
    ]);
    await redis.expire(fileRedisKey, FILE_TTL);

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
      url: req.file.position,
      name: req.file.originalName,
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
    s3FileKey,
  } = value;

  try {
    const accessor = await Member.getMember(projectId, creatorId);

    if (!accessor) {
      return res.status(401).json({ File: "Access denied" });
    }

    const createdFile = await File.createFile(
      creatorId,
      projectId,
      { name, url, s3FileKey }
    );

    // clear files and total count to avoid inaccurate data
    const fileRedisKey = `projects:${projectId}:files`;
    const countRedisKey = `${fileRedisKey}:count`;
    await redis.del([fileRedisKey, countRedisKey]);

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
  } = value;

  try {
    const updatedFile = await File.updateFile(
      fileId,
      accessorId,
      { name }
    );

    // clear files and total count to avoid inaccurate data
    const fileRedisKey = `projects:${updatedFile.project_id}:files`;
    const countRedisKey = `${fileRedisKey}:count`;
    await redis.del([fileRedisKey, countRedisKey]);

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
    const file = await File.getFileById(fileId);

    if (file?.s3_file_key) {
      await deleteFileFromS3(file.s3_file_key);
    }

    await File.deleteFileById(fileId, accessorId);

    // clear files and total count to avoid inaccurate data
    const fileRedisKey = `projects:${file.project_id}:files`;
    const countRedisKey = `${fileRedisKey}:count`;
    await redis.del([fileRedisKey, countRedisKey]);

    res.sendStatus(200);
  } catch (error) {
    let errorStatus;
    switch(error.message.toLowerCase()) {
      case "access denied":
        errorStatus = 401;
        break;
      case "file not found":
        errorStatus = 404;
        break;
      default:
        errorStatus = 500;
    }
    res.status(errorStatus).json({ message: error.message || 'Error deleting File' });
  }
};
