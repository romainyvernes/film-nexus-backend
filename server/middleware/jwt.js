import jwt from "jsonwebtoken";

export const generateAuthToken = (userId) => {
  const payload = { userId };
  return jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: '7 days' });
};

export const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Missing token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
