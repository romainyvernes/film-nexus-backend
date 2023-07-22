import * as Project from '../../models/Project';
import { v4 as uuidv4 } from 'uuid';
import { addProject, addProjectMember, addUser } from "../utils/helpers";
import { projectInfo, newProjectName, memberInfo, newTestUserInfo } from "../utils/testData";

describe('Project Model', () => {
  let user, secondUser;
  beforeAll(async () => {
    // create new user in DB
    user = await addUser({
      username: newTestUserInfo.username,
      firstName: newTestUserInfo.firstName,
      lastName: newTestUserInfo.lastName,
      password: newTestUserInfo.password,
    });
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
      messages: expect.any(Array),
      files: expect.any(Array),
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

  it('should retrieve all projects if no search criteria provided', async () => {
    const projectsObj = await Project.getProjects(newProject.creator_id);

    expect(projectsObj).toMatchObject({
      page: 1,
      projects: expect.any(Array),
      totalCount: expect.any(Number)
    });
    expect(projectsObj.projects).toHaveLength(1);
    expect(projectsObj.projects[0]).toEqual({
      id: expect.stringMatching(newProject.id),
      name: expect.stringMatching(projectInfo.name),
      created_on: newProject.created_on,
      creator_id: expect.stringMatching(user.id),
      members: expect.any(Array),
      messages: expect.any(Array),
      files: expect.any(Array),
      is_admin: expect.any(Boolean),
      position: expect.stringMatching(memberInfo.position)
    });
  });

  it('should retrieve select projects if search criteria provided', async () => {
    // create new project in DB
    const project = await Project.createProject(
      user.id,
      { name: "My newest project" },
      { position: "Director" }
    );

    const projectsObj = await Project.getProjects(user.id, { name: "newest" });

    expect(projectsObj).toMatchObject({
      page: 1,
      projects: expect.any(Array),
      totalCount: 1
    });
    expect(projectsObj.projects).toHaveLength(1);
    expect(projectsObj.projects[0]).toMatchObject({
      id: expect.stringMatching(project.id),
      name: expect.stringMatching(project.name),
      created_on: project.created_on,
      creator_id: expect.stringMatching(user.id),
    });
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

  it('should NOT update a project with incorrect project ID', async () => {
    await expect(Project.updateProject(
      uuidv4(),
      user.id,
      { name: newProjectName },
    )).rejects.toThrow("Project not found");
  });

  it('should NOT update a project if user doesn\'t have admin access', async () => {
    // create second user in DB
    secondUser = await addUser({
      username: "some user",
      firstName: "Testy",
      lastName: "Test",
      password: "testuser123",
    });

    await addProjectMember({
      projectId: newProject.id,
      userId: secondUser.id,
      position: "Crew",
      isAdmin: false,
    });

    await expect(Project.updateProject(
      newProject.id,
      secondUser.id,
      { name: "My project now" },
    )).rejects.toThrow("Access denied");
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
      messages: expect.any(Array),
      files: expect.any(Array),
      is_admin: expect.any(Boolean),
      position: expect.stringMatching(memberInfo.position)
    });

    newProject = updatedProject;
  });

  it('should NOT delete a project if user doesn\'t have admin access', async () => {
    await expect(Project.deleteProject(
      newProject.id,
      secondUser.id,
    )).rejects.toThrow("Access denied");
  });

  it('should delete a project', async () => {
    const deletedProject = await Project.deleteProject(newProject.id, user.id);

    expect(deletedProject).toEqual({
      id: expect.stringMatching(newProject.id),
      name: expect.stringMatching(newProject.name),
      created_on: newProject.created_on,
      creator_id: expect.stringMatching(newProject.creator_id),
      members: expect.any(Array),
      messages: expect.any(Array),
      files: expect.any(Array),
    });
  });
});
