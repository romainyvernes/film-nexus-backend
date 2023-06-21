import * as User from '../models/User';

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.getUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserById = async (req, res) => {
  const userId = req.params.id;
  try {
    const user = await User.getUserById(userId);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving user' });
  }
};

export const createUser = async (req, res) => {
  const { name, email } = req.body;
  try {
    const createdUser = await User.createUser(name, email);
    res.status(201).json(createdUser);
  } catch (error) {
    res.status(500).json({ message: 'Error creating user' });
  }
};

export const updateUser = async (req, res) => {
  const userId = req.params.id;
  const { name, email } = req.body;
  try {
    const updatedUser = await User.updateUser(userId, name, email);
    if (updatedUser) {
      res.json(updatedUser);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating user' });
  }
};

export const deleteUser = async (req, res) => {
  const userId = req.params.id;
  try {
    const deletedUser = await User.deleteUser(userId);
    if (deletedUser) {
      res.json(deletedUser);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user' });
  }
};
