import Joi from "joi";

export const baseSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
});

export const  updatedSchema = baseSchema
  .append({
    id: Joi.string().uuid().required()
  })
  .fork(["username", "firstName", "lastName"], (schema) => schema.optional());
