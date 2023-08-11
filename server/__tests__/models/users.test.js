import * as User from "../../models/User";
import { v4 as uuidv4 } from 'uuid';
import { addProject, addUser, clearDb, populateDb } from "../utils/helpers";
import { newTestUserInfo, projectInfo, updatedTestUserInfo } from "../utils/testData";

describe("User Model", () => {
  beforeAll(async () => {
    await clearDb();
    await populateDb();
  });

  let newTestUser, secondUser, thirdUser, project;

  it("should NOT create a new user without required fields", async () => {
    await expect(User.upsertUser(
      newTestUserInfo.username,
      {
        firstName: newTestUserInfo.firstName,
      },
    )).rejects.toThrow();
  });

  it("should NOT create a new user with incorrectly formatted data", async () => {
    await expect(User.upsertUser(
      newTestUserInfo.username,
      {
        firstName: "",
        lastName: newTestUserInfo.lastName,
      },
    )).rejects.toThrow();
  });

  it("should create a new user", async () => {
    newTestUser = await User.upsertUser(
      newTestUserInfo.username,
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

  it("should find a list of users eligible to be added to a new project as members w/o search criteria", async () => {
    // create 2 new users and project in DB
    [secondUser, thirdUser, project] = await Promise.all([
      addUser({ ...updatedTestUserInfo }),
      addUser({
        username: "jackie_O",
        firstName: "Jackie",
        lastName: "O",
      }),
      addProject({ ...projectInfo, creatorId: newTestUser.id })
    ]);
    const usersObj = await User.getUsers(project.id, newTestUser.id);

    expect(usersObj).toMatchObject({
      page: 1,
      users: expect.any(Array),
      totalCount: expect.any(Number)
    });
    expect(usersObj.users[0]).toEqual({
      id: expect.any(String),
      username: expect.stringMatching(secondUser.username),
      first_name: expect.stringMatching(secondUser.first_name),
      last_name: expect.stringMatching(secondUser.last_name),
      created_on: expect.any(Date),
    });
  });

  it("should find a list of users eligible to be added to a new project as members w/ search criteria", async () => {
    const searchParams = { firstName: "jo" };
    const usersObj = await User.getUsers(project.id, newTestUser.id, searchParams);

    expect(usersObj).toMatchObject({
      page: 1,
      users: expect.any(Array),
      totalCount: expect.any(Number)
    });
    expect(usersObj.users[0]).toEqual({
      id: expect.any(String),
      username: expect.stringMatching(secondUser.username),
      first_name: expect.stringMatching(secondUser.first_name),
      last_name: expect.stringMatching(secondUser.last_name),
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
  });

  it("should return user not found error if attempting to update a user with an invalid ID", async () => {
    await expect(User.updateUser(
      uuidv4(),
      {
        firstName: updatedTestUserInfo.firstName,
        lastName: updatedTestUserInfo.lastName,
      }
    )).rejects.toThrow("User not found");
  });

  it("should NOT update a user with no value to update", async () => {
    await expect(User.updateUser(
      newTestUser.id,
      {}
    )).rejects.toThrow();
  });

  it("should NOT update a user with incorrectly formatted values", async () => {
    await expect(User.updateUser(
      newTestUser.id,
      {
        lastName: 123
      }
    )).rejects.toThrow();
  });

  it("should update a user", async () => {
    const updatedTestUser = await User.updateUser(
      newTestUser.id,
      {
        firstName: updatedTestUserInfo.firstName,
        lastName: updatedTestUserInfo.lastName,
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

  it("should return undefined if attempting to delete a user with an invalid ID", async () => {
    await expect(User.deleteUser(
      uuidv4()
    )).rejects.toThrow();
  });

  it("should delete a user", async () => {
    const deletedUser = await User.deleteUser(
      newTestUser.id,
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
