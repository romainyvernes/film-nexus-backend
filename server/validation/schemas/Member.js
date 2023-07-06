import Joi from "joi";

export const baseSchema = Joi.object({
  projectId: Joi.string().uuid().required(),
  userId: Joi.string().uuid().required(),
  position: Joi.string().required(),
  isAdmin: Joi.boolean().required(),
});

export const  updatedSchema = baseSchema.append({
  accessorId: Joi.string().uuid().required(),
}).fork(["position", "isAdmin"], (schema) => schema.optional());
