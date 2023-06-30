import * as Member from "../../models/Member";
import pool from "../../db";
import { addProject, addUser, clearDb, populateDb } from "../utils/helpers";
import { memberInfo, newTestUserInfo, projectInfo, updatedMemberInfo } from "../utils/testData";

describe('Member Model', () => {
  let user, secondUser, project, adminMember, nonAdminMember;

  beforeAll(async () => {
    await populateDb();
    // create new user in DB
    user = await addUser({
      username: newTestUserInfo.username,
      first_name: newTestUserInfo.firstName,
      last_name: newTestUserInfo.lastName,
      password: newTestUserInfo.password,
    });
    // add new project in DB
    project = await addProject({
      name: projectInfo.name,
      creator_id: user.id,
    });
  });

  afterAll(async () => {
    await clearDb();
    await pool.end();
  });

  it('should NOT create a project member if required fields are missing', async () => {
    await expect(Member.createMember(
      project.id,
      user.id,
      {
        position: memberInfo.position
      },
    )).rejects.toThrow();
  });

  it('should NOT create a project member if data is incorrectly formatted', async () => {
    await expect(Member.createMember(
      project.id,
      user.id,
      {
        position: "",
        is_admin: true,
      },
    )).rejects.toThrow();
  });

  it('should create a new project member', async () => {
    adminMember = await Member.createMember(
      project.id,
      user.id,
      {
        position: memberInfo.position,
        is_admin: true,
      },
    );

    expect(adminMember).toEqual({
      project_id: expect.stringMatching(project.id),
      user_id: expect.stringMatching(user.id),
      is_admin: true,
      position: expect.stringMatching(memberInfo.position),
    });
  });

  it('should NOT update a project member if required fields are missing', async () => {
    await expect(Member.updateMember(
      project.id,
      user.id,
      user.id,
      {},
    )).rejects.toThrow();
  });

  it('should NOT update a project member if data is incorrectly formatted', async () => {
    await expect(Member.updateMember(
      project.id,
      user.id,
      user.id,
      { position: "" },
    )).rejects.toThrow();
  });

  it('should update a project member', async () => {
    adminMember = await Member.updateMember(
      project.id,
      user.id,
      user.id,
      { position: updatedMemberInfo.position },
    );

    expect(adminMember).toEqual({
      project_id: expect.stringMatching(project.id),
      user_id: expect.stringMatching(user.id),
      is_admin: true,
      position: expect.stringMatching(updatedMemberInfo.position),
    });
  });

  it('should NOT update a project member if user doesn\'t have admin access', async () => {
    secondUser = await addUser({
      username: "second_user",
      first_name: "Second",
      last_name: "User",
      password: "password123",
    });

    nonAdminMember = await Member.createMember(
      project.id,
      secondUser.id,
      {
        position: "Crew",
        is_admin: false,
      },
    );

    await expect(Member.updateMember(
      project.id,
      secondUser.id,
      secondUser.id,
      { position: updatedMemberInfo.position },
    )).rejects.toThrow("Update failed");
  });

  it('should NOT delete a project member by id if user doesn\'t have admin access', async () => {
    await expect(Member.deleteMemberById(
      project.id,
      user.id,
      secondUser.id,
    )).rejects.toThrow("Deletion failed");
  });

  it('should NOT delete all members of a specific project if user doesn\'t have admin access', async () => {
    await expect(Member.deleteMembersByProjectId(
      project.id,
      secondUser.id
    )).rejects.toThrow("Deletion failed");
  });

  it('should delete a project member by id', async () => {
    const deletedMember = await Member.deleteMemberById(
      project.id,
      secondUser.id,
      user.id,
    );

    expect(deletedMember).toEqual({
      project_id: expect.stringMatching(project.id),
      user_id: expect.stringMatching(secondUser.id),
      is_admin: nonAdminMember.is_admin,
      position: expect.stringMatching(nonAdminMember.position),
    });

    nonAdminMember = undefined;
  });

  it('should delete all members of a specific project', async () => {
    const deletedMembers = await Member.deleteMembersByProjectId(
      project.id,
      user.id
    );

    expect(deletedMembers).toBeInstanceOf(Array);
    expect(deletedMembers).toHaveLength(1);
    expect(deletedMembers[0]).toEqual({
      project_id: expect.stringMatching(adminMember.project_id),
      user_id: expect.stringMatching(adminMember.user_id),
      is_admin: adminMember.is_admin,
      position: expect.stringMatching(adminMember.position),
    });
  });
});
