import Joi from "joi";

export const baseSchema = Joi.object({
  creatorId: Joi.string().uuid().required(),
  projectId: Joi.string().uuid().required(),
  text: Joi.string().required(),
});

export const updatedSchema = baseSchema
  .append({
    id: Joi.string().uuid().required(),
    accessorId: Joi.string().uuid().required(),
  })
  .fork(["projectId", "creatorId", "text"], (schema) => schema.optional());
