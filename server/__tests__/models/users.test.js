import * as User from "../../models/User";
import pool from "../../db";
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

  it("should create a new user", async () => {
    newTestUser = await User.createUser(
      newTestUserInfo.username,
      newTestUserInfo.firstName,
      newTestUserInfo.lastName,
      newTestUserInfo.password
    );

    expect(newTestUser).toEqual({
      id: expect.any(String),
      username: expect.stringMatching(newTestUserInfo.username),
      first_name: expect.stringMatching(newTestUserInfo.firstName),
      last_name: expect.stringMatching(newTestUserInfo.lastName),
      created_on: expect.any(Date),
    });
  });

  it("should NOT create a new user that already exists", async () => {
    await expect(User.createUser(
      newTestUserInfo.username,
      newTestUserInfo.firstName,
      newTestUserInfo.lastName,
      newTestUserInfo.password
    )).rejects.toThrow("User already exists");
  });

  it("should find a user by ID", async () => {
    const user = await User.getUserById(newTestUser.id);

    expect(user).toEqual({
      id: expect.stringMatching(newTestUser.id),
      username: expect.stringMatching(newTestUserInfo.username),
      first_name: expect.stringMatching(newTestUserInfo.firstName),
      last_name: expect.stringMatching(newTestUserInfo.lastName),
      created_on: newTestUser.created_on,
      password: expect.not.stringMatching(newTestUserInfo.password)
    });
  });

  it("should find a user by username", async () => {
    const user = await User.getUserByUsername(newTestUser.username);

    expect(user).toEqual({
      id: expect.stringMatching(newTestUser.id),
      username: expect.stringMatching(newTestUserInfo.username),
      first_name: expect.stringMatching(newTestUserInfo.firstName),
      last_name: expect.stringMatching(newTestUserInfo.lastName),
      created_on: newTestUser.created_on,
      password: expect.not.stringMatching(newTestUserInfo.password)
    });
  });

  it("should NOT update a user without proper credentials", async () => {
    await expect(User.updateUser(
      newTestUser.id,
      incorrectPassword,
      {
        first_name: updatedTestUserInfo.firstName,
        last_name: updatedTestUserInfo.lastName,
        password: updatedTestUserInfo.password,
      }
    )).rejects.toThrow("Incorrect password");
  });

  it("should NOT update a user with proper credentials but no value to update", async () => {
    await expect(User.updateUser(
      newTestUser.id,
      newTestUserInfo.password,
      {}
    )).rejects.toThrow("At least one updated value is required");
  });

  it("should update a user with proper credentials", async () => {
    const updatedTestUser = await User.updateUser(
      newTestUser.id,
      newTestUserInfo.password,
      {
        first_name: updatedTestUserInfo.firstName,
        last_name: updatedTestUserInfo.lastName,
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

  it("should delete a user with proper credentials", async () => {
    const deletedUser = await User.deleteUser(
      newTestUser.id, updatedTestUserInfo.password
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
