import * as Member from "../models/Member";
import { baseSchema, updatedSchema } from "../validation/schemas/Member";

export const createMember = async (req, res) => {
  const { error, value } = baseSchema.validate(
    {
      projectId: req.params.id,
      userId: req.body.memberId,
      ...req.body
    },
    { allowUnknown: true }
  );

  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const {
    projectId,
    userId: memberId,
    position,
    isAdmin,
  } = value;
  const userId = req.userId;

  try {
    const [accessor, existingMember] = await Promise.all([
      Member.getMember(projectId, userId),
      Member.getMember(projectId, memberId)
    ]);

    if (!accessor || !accessor.is_admin || userId === memberId) {
      return res.status(401).json({ message: "Access denied" });
    }

    if (existingMember) {
      return res.status(401).json({ message: "User is already a member" });
    }

    const createdMember = await Member.createMember(
      projectId,
      memberId,
      { position, isAdmin }
    );
    res.status(201).json(createdMember);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error creating member' });
  }
};

export const updateMember = async (req, res) => {
  const { error, value } = updatedSchema.min(4).validate(
    {
      projectId: req.params.id,
      accessorId: req.userId,
      userId: req.params.memberId,
      ...req.body
    },
    { allowUnknown: true }
  );

  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const {
    projectId,
    userId: memberId,
    accessorId: userId,
    position,
    isAdmin,
  } = value;

  try {
    const updatedMember = await Member.updateMember(
      projectId,
      memberId,
      userId,
      { position, isAdmin }
    );
    res.json(updatedMember);
  } catch (error) {
    let errorStatus;
    switch(error.message.toLowerCase()) {
      case "at least one update is required":
        errorStatus = 400;
        break;
      case "access denied":
        errorStatus = 401;
        break;
      case "project not found":
        errorStatus = 404;
        break;
      default:
        errorStatus = 500;
    }
    res.status(errorStatus).json({ message: error.message || 'Error updating member' });
  }
};

export const deleteMember = async (req, res) => {
  const { error, value } = updatedSchema.validate(
    {
      projectId: req.params.id,
      accessorId: req.userId,
      userId: req.params.memberId,
    },
    { allowUnknown: true }
  );

  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const {
    projectId,
    userId: memberId,
    accessorId: userId,
  } = value;

  try {
    await Member.deleteMemberById(projectId, memberId, userId);
    res.sendStatus(200);
  } catch (error) {
    let errorStatus;
    switch(error.message.toLowerCase()) {
      case "access denied":
        errorStatus = 401;
        break;
      case "member not found":
        errorStatus = 404;
        break;
      default:
        errorStatus = 500;
    }
    res.status(errorStatus).json({ message: error.message || 'Error deleting member' });
  }
};
