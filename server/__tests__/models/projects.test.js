import * as Project from '../../models/Project';
import pool from "../../db";
import { addProjectMember, addUser, clearDb, populateDb } from "../utils/helpers";
import { projectInfo, newProjectName, memberInfo, newTestUserInfo } from "../utils/testData";

describe('Project Model', () => {
  let user, secondUser, nonAdminMember;
  beforeAll(async () => {
    await populateDb();
    // create new user in DB
    user = await addUser({
      username: newTestUserInfo.username,
      first_name: newTestUserInfo.firstName,
      last_name: newTestUserInfo.lastName,
      password: newTestUserInfo.password,
    });
  });

  afterAll(async () => {
    await clearDb();
    await pool.end();
  });

  let newProject;

  it('should NOT create a new project without required fields', async () => {
    await expect(Project.createProject(
      user.id,
      {},
      { position: memberInfo.position }
    )).rejects.toThrow();
  });

  it('should NOT create a new project with incorrectly formatted fields', async () => {
    await expect(Project.createProject(
      user.id,
      { name: "" },
      { position: memberInfo.position }
    )).rejects.toThrow();
  });

  it('should create a new project', async () => {
    newProject = await Project.createProject(
      user.id,
      { name: projectInfo.name },
      { position: memberInfo.position }
    );

    expect(newProject).toEqual({
      id: expect.any(String),
      name: expect.stringMatching(projectInfo.name),
      created_on: expect.any(Date),
      creator_id: expect.stringMatching(user.id)
    });
  });

  it('should find a project by ID', async () => {
    const project = await Project.getProjectById(newProject.id, newProject.creator_id);

    expect(project).toEqual({
      id: expect.stringMatching(newProject.id),
      name: expect.stringMatching(projectInfo.name),
      created_on: newProject.created_on,
      creator_id: expect.stringMatching(user.id),
      members: expect.any(Array),
      is_admin: expect.any(Boolean),
      position: expect.stringMatching(memberInfo.position)
    });

    expect(project.members[0]).toMatchObject({
      id: expect.stringMatching(user.id),
      username: expect.stringMatching(newTestUserInfo.username),
      first_name: expect.stringMatching(newTestUserInfo.firstName),
      last_name: expect.stringMatching(newTestUserInfo.lastName),
    });
  });

  it('should retrieve all projects', async () => {
    const projects = await Project.getProjects(newProject.creator_id);

    expect(projects).toBeInstanceOf(Array)
    expect(projects).toHaveLength(1);
    expect(projects[0]).toMatchObject(newProject);
  });

  it('should NOT update a project without required fields', async () => {
    await expect(Project.updateProject(
      newProject.id,
      "",
      { name: newProjectName },
    )).rejects.toThrow();
  });

  it('should NOT update a project with incorrectly formatted fields', async () => {
    await expect(Project.updateProject(
      newProject.id,
      user.id,
      { name: "" },
    )).rejects.toThrow();
  });

  it('should NOT update a project if user doesn\'t have admin access', async () => {
    // create second user in DB
    secondUser = await addUser({
      username: "some user",
      first_name: "Testy",
      last_name: "Test",
      password: "testuser123",
    });

    nonAdminMember = await addProjectMember({
      project_id: newProject.id,
      user_id: secondUser.id,
      position: "Crew",
      is_admin: false,
    });

    await expect(Project.updateProject(
      newProject.id,
      secondUser.id,
      { name: "My project now" },
    )).rejects.toThrow("Update failed");
  });

  it('should update a project', async () => {
    const updatedProject = await Project.updateProject(
      newProject.id,
      user.id,
      { name: newProjectName },
    );

    expect(updatedProject).toEqual({
      id: expect.stringMatching(newProject.id),
      name: expect.stringMatching(newProjectName),
      created_on: newProject.created_on,
      creator_id: expect.stringMatching(user.id),
      members: expect.any(Array),
      is_admin: expect.any(Boolean),
      position: expect.stringMatching(memberInfo.position)
    });

    newProject = updatedProject;
  });

  it('should NOT delete a project if user doesn\'t have admin access', async () => {
    await expect(Project.deleteProject(
      newProject.id,
      secondUser.id,
    )).rejects.toThrow("Deletion failed");
  });

  it('should delete a project', async () => {
    const deletedProject = await Project.deleteProject(newProject.id, user.id);

    expect(deletedProject).toEqual({
      id: expect.stringMatching(newProject.id),
      name: expect.stringMatching(newProject.name),
      created_on: newProject.created_on,
      creator_id: expect.stringMatching(newProject.creator_id),
      members: expect.any(Array)
    });
  });
});
