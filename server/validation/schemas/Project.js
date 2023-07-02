import Joi from "joi";

export const baseSchema = Joi.object({
  name: Joi.string().required(),
  creatorId: Joi.string().uuid().required(),
});

export const  updatedSchema = baseSchema.append({
  id: Joi.string().required(),
}).fork(["name", "creatorId"], (schema) => schema.optional());
