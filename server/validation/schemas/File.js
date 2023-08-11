import Joi from "joi";

export const baseSchema = Joi.object({
  creatorId: Joi.string().uuid().required(),
  projectId: Joi.string().uuid().required(),
  name: Joi.string().required(),
  url: Joi.string().uri().required(),
  s3FileKey: Joi.string().optional(),
});

export const updatedSchema = baseSchema
  .append({
    id: Joi.string().uuid().required(),
    accessorId: Joi.string().uuid().required(),
  })
  .fork(["projectId", "creatorId", "name", "url"], (schema) => schema.optional());
