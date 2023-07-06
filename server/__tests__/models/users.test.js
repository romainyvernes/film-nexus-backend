import * as User from "../../models/User";
import pool from "../../db";
import { v4 as uuidv4 } from 'uuid';
import { clearDb, populateDb } from "../utils/helpers";
import { incorrectPassword, newTestUserInfo, updatedTestUserInfo } from "../utils/testData";

describe("User Model", () => {
  beforeAll(async () => {
    await populateDb();
  });

  afterAll(async () => {
    await clearDb();
    await pool.end();
  });

  let newTestUser;

  it("should NOT create a new user without required fields", async () => {
    await expect(User.createUser(
      newTestUserInfo.username,
      newTestUserInfo.password,
      {
        firstName: newTestUserInfo.firstName,
      },
    )).rejects.toThrow();
  });

  it("should NOT create a new user with incorrectly formatted data", async () => {
    await expect(User.createUser(
      newTestUserInfo.username,
      newTestUserInfo.password,
      {
        firstName: "",
        lastName: newTestUserInfo.lastName,
      },
    )).rejects.toThrow();
  });

  it("should create a new user", async () => {
    newTestUser = await User.createUser(
      newTestUserInfo.username,
      newTestUserInfo.password,
      {
        firstName: newTestUserInfo.firstName,
        lastName: newTestUserInfo.lastName,
      },
    );

    expect(newTestUser).toEqual({
      id: expect.any(String),
      username: expect.stringMatching(newTestUserInfo.username),
      first_name: expect.stringMatching(newTestUserInfo.firstName),
      last_name: expect.stringMatching(newTestUserInfo.lastName),
      created_on: expect.any(Date),
    });
  });

  it("should find a user by ID", async () => {
    const user = await User.getUserById(newTestUser.id);

    expect(user).toEqual({
      id: expect.stringMatching(newTestUser.id),
      username: expect.stringMatching(newTestUserInfo.username),
      first_name: expect.stringMatching(newTestUserInfo.firstName),
      last_name: expect.stringMatching(newTestUserInfo.lastName),
      created_on: newTestUser.created_on,
    });
    expect(user.password).toBeUndefined();
  });

  it("should return undefined if attempting to retrieve a user with an invalid ID", async () => {
    const user = await User.getUserById(uuidv4());
    expect(user).toBeUndefined();
  });

  it("should find a user by username", async () => {
    const user = await User.getUserByUsername(newTestUser.username);

    expect(user).toEqual({
      id: expect.stringMatching(newTestUser.id),
      username: expect.stringMatching(newTestUserInfo.username),
      first_name: expect.stringMatching(newTestUserInfo.firstName),
      last_name: expect.stringMatching(newTestUserInfo.lastName),
      created_on: newTestUser.created_on,
    });
    expect(user.password).toBeUndefined();
  });

  it("should return user not found error if attempting to update a user with an invalid ID", async () => {
    await expect(User.updateUser(
      uuidv4(),
      newTestUserInfo.password,
      {
        firstName: updatedTestUserInfo.firstName,
        lastName: updatedTestUserInfo.lastName,
        password: updatedTestUserInfo.password
      }
    )).rejects.toThrow("User not found");
  });

  it("should NOT update a user without proper credentials", async () => {
    await expect(User.updateUser(
      newTestUser.id,
      incorrectPassword,
      {
        firstName: updatedTestUserInfo.firstName,
        lastName: updatedTestUserInfo.lastName,
        password: updatedTestUserInfo.password,
      }
    )).rejects.toThrow("Incorrect password");
  });

  it("should NOT update a user with proper credentials but no value to update", async () => {
    await expect(User.updateUser(
      newTestUser.id,
      newTestUserInfo.password,
      {}
    )).rejects.toThrow();
  });

  it("should NOT update a user with proper credentials but incorrectly formatted values", async () => {
    await expect(User.updateUser(
      newTestUser.id,
      newTestUserInfo.password,
      {
        lastName: 123
      }
    )).rejects.toThrow();
  });

  it("should update a user with proper credentials", async () => {
    const updatedTestUser = await User.updateUser(
      newTestUser.id,
      newTestUserInfo.password,
      {
        firstName: updatedTestUserInfo.firstName,
        lastName: updatedTestUserInfo.lastName,
        password: updatedTestUserInfo.password
      }
    );

    expect(updatedTestUser).toEqual({
      id: expect.stringMatching(newTestUser.id),
      username: expect.stringMatching(newTestUser.username),
      first_name: expect.stringMatching(updatedTestUserInfo.firstName),
      last_name: expect.stringMatching(updatedTestUserInfo.lastName),
      created_on: newTestUser.created_on,
    });

    newTestUser = updatedTestUser;
  });

  it("should NOT delete a user without proper credentials", async () => {
    await expect(User.deleteUser(
      newTestUser.id,
      incorrectPassword
    )).rejects.toThrow("Incorrect password");
  });

  it("should return undefined if attempting to delete a user with an invalid ID", async () => {
    await expect(User.deleteUser(
      uuidv4(),
      updatedTestUserInfo.password
    )).rejects.toThrow();
  });

  it("should delete a user with proper credentials", async () => {
    const deletedUser = await User.deleteUser(
      newTestUser.id,
      updatedTestUserInfo.password
    );

    expect(deletedUser).toEqual({
      id: expect.stringMatching(newTestUser.id),
      username: expect.stringMatching(newTestUser.username),
      first_name: expect.stringMatching(newTestUser.first_name),
      last_name: expect.stringMatching(newTestUser.last_name),
      created_on: newTestUser.created_on,
    });
  });
});
