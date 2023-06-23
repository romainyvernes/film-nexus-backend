import * as User from "../../models/User";
import pool from "../../db";
import { clearDb, populateDb } from "../utils/helpers";
import { newTestUserInfo, updatedTestUserInfo } from "../utils/testData";

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

    expect(newTestUser).toMatchObject({
      id: expect.any(String),
      username: expect.stringMatching(newTestUserInfo.username),
      first_name: expect.stringMatching(newTestUserInfo.firstName),
      last_name: expect.stringMatching(newTestUserInfo.lastName),
      created_on: expect.any(Date),
      password: expect.not.stringMatching(newTestUserInfo.password),
    });
  });

  it("should find a user by ID", async () => {
    const user = await User.getUserById(newTestUser.id);

    expect(user).toMatchObject({
      id: expect.stringMatching(newTestUser.id),
      username: expect.stringMatching(newTestUserInfo.username),
      first_name: expect.stringMatching(newTestUserInfo.firstName),
      last_name: expect.stringMatching(newTestUserInfo.lastName),
      created_on: newTestUser.created_on,
      password: expect.not.stringMatching(newTestUser.password),
    });
  });

  it("should update a user, including their password", async () => {
    const updatedTestUser = await User.updateUser(
      newTestUser.id,
      updatedTestUserInfo.username,
      updatedTestUserInfo.firstName,
      updatedTestUserInfo.lastName,
      newTestUserInfo.password,
      updatedTestUserInfo.password
    );

    expect(updatedTestUser).toMatchObject({
      id: expect.stringMatching(newTestUser.id),
      username: expect.stringMatching(updatedTestUserInfo.username),
      first_name: expect.stringMatching(updatedTestUserInfo.firstName),
      last_name: expect.stringMatching(updatedTestUserInfo.lastName),
      created_on: newTestUser.created_on,
      password: expect.any(String),
    });

    expect(updatedTestUser.password).not.toEqual(updatedTestUserInfo.password);
    expect(updatedTestUser.password).not.toEqual(newTestUser.password);

    newTestUser = updatedTestUser;
  });

  it("should delete a user", async () => {
    const deletedUser = await User.deleteUser(newTestUser.id);

    expect(deletedUser).toMatchObject({
      id: expect.stringMatching(newTestUser.id),
      username: expect.stringMatching(newTestUser.username),
      first_name: expect.stringMatching(newTestUser.first_name),
      last_name: expect.stringMatching(newTestUser.last_name),
      created_on: newTestUser.created_on,
      password: newTestUser.password,
    });
  });
});
