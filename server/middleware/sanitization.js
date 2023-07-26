import validator from "validator";

export const sanitizeObj = (obj) => {
  const sanitizedObj = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string" && key !== "url") {
      sanitizedObj[key] = validator.escape(validator.trim(value));
    } else {
      sanitizedObj[key] = value;
    }
  }
  return sanitizedObj;
};

export const sanitizeDataInput = (req, res, next) => {
  req.body = sanitizeObj(req.body);
  req.query = sanitizeObj(req.query);
  next();
};
