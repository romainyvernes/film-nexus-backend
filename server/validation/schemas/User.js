import Joi from "joi";

export const baseSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required(),
});

export const  updatedSchema = baseSchema
  .append({
    id: Joi.string().uuid().required(),
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).optional(),
  })
  .fork(["username", "firstName", "lastName", "password"], (schema) => schema.optional());
