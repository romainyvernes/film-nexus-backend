import * as User from "../../models/User";
import pool from "../../db";
import { clearDb, populateDb } from "../utils/helpers";

describe("User Model", () => {
  beforeAll(async () => {
    await populateDb();
  });

  afterAll(async () => {
    await clearDb();
    await pool.end();
  });

  const newUserInfo = {
    username: "test_user",
    first_name: "test",
    last_name: "testy",
    password: "password123"
  };

  it("should create a new user", async () => {
    const newUser = await User.createUser(
      newUserInfo.username,
      newUserInfo.first_name,
      newUserInfo.last_name,
      newUserInfo.password
    );
    expect(newUser).toMatchObject({
      id: expect.any(String),
      username: expect(newUser.username).toBe(newUserInfo.username),
      first_name: expect(newUser.first_name).toBe(newUserInfo.first_name),
      last_name: expect(newUser.last_name).toBe(newUserInfo.last_name),
      created_on: expect.any(Date),
      password: expect.any(String),
    });
  });

  it("should find a user by username", async () => {
    // Test code for finding a user by username
  });

  it("should update a user", async () => {
    // Test code for updating a user
  });

  it("should delete a user", async () => {
    // Test code for deleting a user
  });
});
