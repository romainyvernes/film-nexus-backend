import { v4 as uuidv4 } from 'uuid';

export const newTestUserInfo = {
  username: "test_user",
  firstName: "test",
  lastName: "testy",
  password: "password123"
};

export const updatedTestUserInfo = {
  username: "john_123",
  firstName: "John",
  lastName: "Doe",
  password: "test123"
};

export const projectInfo = {
  name: "Test Project",
  creatorId: uuidv4()
};

export const newProjectName = "Updated Project";
