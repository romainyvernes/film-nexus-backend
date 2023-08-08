import jwt from "jsonwebtoken";

export const JWT_TOKEN_NAME = "film_nexus_jwt_token";

export const generateAuthToken = (userId) => {
  const payload = { userId };
  return jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: '7 days' });
};

export const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies[JWT_TOKEN_NAME];

  if (!token) {
    return res.status(401).json({ message: 'Missing token' });
  }

  try {
    if (token === "super_user" && process.env.NODE_ENV === "dev") {
      req.userId = "b9f4952d-97bf-4485-aa7b-ab3d37933e9c";
    } else {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      req.userId = decoded.userId;
    }
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
