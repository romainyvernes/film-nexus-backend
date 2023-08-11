import * as Message from "../models/Message";
import * as Member from "../models/Member";
import Joi from "joi";
import { baseSchema, updatedSchema } from "../validation/schemas/Message";
import { default as redis } from "../redis";
import { formatDataForSortedSet } from "../utils/helpers";

// expiration time in Redis
const MESSAGE_TTL = 60 * 5; // 5 minutes

export const getMessages = async (req, res) => {
  const { error, value } = baseSchema
    .fork(["creatorId", "text"], (schema) => schema.optional())
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
  const messageRedisKey = `projects:${projectId}:messages`;
  const countRedisKey = `${messageRedisKey}:count`;
  offset = offset || 0;

  try {
    const accessor = await Member.getMember(projectId, userId);

    if (!accessor) {
      return res.status(401).json({ message: "Access denied" });
    }

    const endValue = offset + Message.MESSAGES_LIMIT;
    const [storedResults, totalCount] = await Promise.all([
      redis.zrangebyscore(messageRedisKey, offset, endValue),
      redis.get(countRedisKey)
    ]);
    const expectedCount = endValue - offset;

    if (storedResults.length === expectedCount) {
      return res.json({
        totalCount,
        messages: storedResults.map((result) => JSON.parse(result)),
        offset
      });
    }

    const messageObj = await Message.getMessagesByProjectId(projectId, offset);
    const formattedMessages = formatDataForSortedSet(messageObj.messages, offset);

    await Promise.all([
      redis.zadd(messageRedisKey, ...formattedMessages),
      redis.set(countRedisKey, messageObj.totalCount, "EX", 5 * 60)
    ]);
    await redis.expire(messageRedisKey, MESSAGE_TTL);

    res.json(messageObj);
  } catch(error) {
    res.status(500).json({ message: error.message || 'Error retrieving messages' });
  }
};

export const createMessage = async (req, res) => {
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
    text,
  } = value;

  try {
    const accessor = await Member.getMember(projectId, creatorId);

    if (!accessor) {
      return res.status(401).json({ message: "Access denied" });
    }

    const createdMessage = await Message.createMessage(
      creatorId,
      projectId,
      { text }
    );

    // clear messages and total count to avoid inaccurate data
    const messageRedisKey = `projects:${projectId}:messages`;
    const countRedisKey = `${messageRedisKey}:count`;
    await redis.del([messageRedisKey, countRedisKey]);

    res.status(201).json(createdMessage);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error creating message' });
  }
};

export const deleteMessage = async (req, res) => {
  const { error, value } = updatedSchema.validate(
    {
      accessorId: req.userId,
      id: req.params.messageId,
    },
    { allowUnknown: true }
  );

  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const {
    id: messageId,
    accessorId,
  } = value;

  try {
    const deletedMessage = await Message.deleteMessageById(messageId, accessorId);

    // clear messages and total count to avoid inaccurate data
    const messageRedisKey = `projects:${deletedMessage.project_id}:messages`;
    const countRedisKey = `${messageRedisKey}:count`;
    await redis.del([messageRedisKey, countRedisKey]);

    res.sendStatus(200);
  } catch (error) {
    let errorStatus;
    switch(error.message.toLowerCase()) {
      case "access denied":
        errorStatus = 401;
        break;
      case "message not found":
        errorStatus = 404;
        break;
      default:
        errorStatus = 500;
    }
    res.status(errorStatus).json({ message: error.message || 'Error deleting message' });
  }
};
