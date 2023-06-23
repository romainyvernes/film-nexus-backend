import * as Project from '../../models/Project';
import pool from "../../db";
import { clearDb, populateDb } from "../utils/helpers";
import { projectInfo, newProjectName } from "../utils/testData";

describe('Project Model', () => {
  beforeAll(async () => {
    await populateDb();
  });

  afterAll(async () => {
    await clearDb();
    await pool.end();
  });

  let newProject;

  it('should create a new project', async () => {
    newProject = await Project.createProject(
      projectInfo.name,
      projectInfo.creatorId
    );

    expect(newProject).toMatchObject({
      id: expect.any(String),
      name: expect.stringMatching(projectInfo.name),
      created_on: expect.any(Date),
      creator_id: expect.stringMatching(projectInfo.creatorId),
    });
  });

  it('should find a project by ID', async () => {
    const project = await Project.getProjectById(newProject.id);

    expect(project).toMatchObject({
      id: expect.stringMatching(newProject.id),
      name: expect.stringMatching(projectInfo.name),
      created_on: newProject.created_on,
      creator_id: expect.stringMatching(projectInfo.creatorId),
    });
  });

  it('should retrieve all projects', async () => {
    const projects = await Project.getProjects();

    expect(projects).toBeInstanceOf(Array)
    expect(projects).toHaveLength(1);
    expect(projects[0]).toMatchObject(newProject);
  });

  it('should update a project', async () => {
    const updatedProject = await Project.updateProject(
      newProject.id,
      newProjectName
    );

    expect(updatedProject).toMatchObject({
      id: expect.stringMatching(newProject.id),
      name: expect.stringMatching(newProjectName),
      created_on: newProject.created_on,
      creator_id: expect.stringMatching(projectInfo.creatorId),
    });

    newProject = updatedProject;
  });

  it('should delete a project', async () => {
    const deletedProject = await Project.deleteProject(newProject.id);

    expect(deletedProject).toMatchObject({
      id: expect.stringMatching(newProject.id),
      name: expect.stringMatching(newProject.name),
      created_on: newProject.created_on,
      creator_id: expect.stringMatching(newProject.creator_id),
    });
  });
});
