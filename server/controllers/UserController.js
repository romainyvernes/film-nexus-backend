import * as User from '../models/User';

export const getUserById = async (req, res) => {
  const id = req.params.id;
  try {
    const user = await User.getUserById(id);
    if (user) {
      const { password, ...sanitizedUser } = user;
      res.json(sanitizedUser);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error retrieving user' });
  }
};

export const createUser = async (req, res) => {
  const {
    username,
    firstName,
    lastName,
    password,
  } = req.body;
  try {
    const createdUser = await User.createUser(
      username,
      firstName,
      lastName,
      password
    );
    res.status(201).json(createdUser);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error creating user' });
  }
};

export const updateUser = async (req, res) => {
  const id = req.params.id;
  const {
    username,
    firstName,
    lastName,
    currentPassword,
    newPassword,
  } = req.body;
  try {
    const updatedUser = await User.updateUser(
      id,
      username,
      firstName,
      lastName,
      currentPassword,
      newPassword
    );
    if (updatedUser) {
      res.json(updatedUser);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error updating user' });
  }
};

export const deleteUser = async (req, res) => {
  const id = req.params.id;
  const { currentPassword } = req.body;
  try {
    const deletedUser = await User.deleteUser(id, currentPassword);
    if (deletedUser) {
      res.sendStatus(200);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error deleting user' });
  }
};
