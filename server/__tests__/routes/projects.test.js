import request from 'supertest';
import app from '../../app';
import { addUser, addProjectMember } from "../utils/helpers";
import { projectInfo, newProjectName, newTestUserInfo, memberInfo } from "../utils/testData";
import { generateAuthToken } from "../../middleware/jwt";

describe('Projects Routes', () => {
  let token, user, secondUser, secondToken;
  beforeAll(async () => {
    // create new user in DB
    user = await addUser({
      username: newTestUserInfo.username,
      firstName: newTestUserInfo.firstName,
      lastName: newTestUserInfo.lastName,
      password: newTestUserInfo.password,
    });
    token = generateAuthToken(user.id);
  });

  let newProject;

  it('POST Prevent creation of new project without required fields', async () => {
    const response = await request(app)
      .post("/api/projects")
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      message: expect.any(String)
    });
  });

  it('POST Prevent creation of new project with incorrectly formatted fields', async () => {
    const response = await request(app)
      .post("/api/projects")
      .send({
        name: "",
        position: memberInfo.position,
      })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      message: expect.any(String)
    });
  });

  it('POST Create a new project', async () => {
    const response = await request(app)
      .post("/api/projects")
      .send({
        name: projectInfo.name,
        position: memberInfo.position,
      })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`);

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toEqual(201);
    expect(response.body).toEqual({
      id: expect.any(String),
      name: expect.stringMatching(projectInfo.name),
      created_on: expect.any(String),
      creator_id: expect.stringMatching(user.id)
    });

    newProject = response.body;
  });

  it('GET Retrieve all projects', async () => {
    const response = await request(app)
      .get(`/api/projects`)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`);

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toEqual(200);
    // expect(response.body).toEqual({
    //   projects: expect.any(Array),
    //   totalCount: expect.any(Number),
    //   totalPageCount: expect.any(Number),
    //   currentPageCount: expect.any(Number),
    // });
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body[0]).toEqual({
      id: expect.stringMatching(newProject.id),
      name: expect.stringMatching(projectInfo.name),
      created_on: newProject.created_on,
      creator_id: expect.stringMatching(user.id),
      members: expect.any(Array),
      is_admin: expect.any(Boolean),
      position: expect.stringMatching(memberInfo.position)
    });
  });

  it('GET Retrieve a specific project', async () => {
    const response = await request(app)
      .get(`/api/projects/${newProject.id}`)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`);

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      id: expect.stringMatching(newProject.id),
      name: expect.stringMatching(projectInfo.name),
      created_on: newProject.created_on,
      creator_id: expect.stringMatching(user.id),
      members: expect.any(Array),
      is_admin: expect.any(Boolean),
      position: expect.stringMatching(memberInfo.position)
    });
  });

  it('PUT Prevent update of a project without required fields', async () => {
    const response = await request(app)
      .put(`/api/projects/${newProject.id}`)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      message: expect.any(String)
    });
  });

  it('PUT Prevent update of a project with incorrectly formatted fields', async () => {
    const response = await request(app)
      .put(`/api/projects/${newProject.id}`)
      .send({ name: "" })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      message: expect.any(String)
    });
  });

  it('PUT Prevent update of a project if user doesn\'t have admin access', async () => {
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

    secondToken = generateAuthToken(secondUser.id);

    const response = await request(app)
      .put(`/api/projects/${newProject.id}`)
      .send({ name: "My project now" })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${secondToken}`);

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      message: "Access denied"
    });
  });

  it('PUT Update a specific project', async () => {
    const response = await request(app)
      .put(`/api/projects/${newProject.id}`)
      .send({ name: newProjectName })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`);

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      id: expect.stringMatching(newProject.id),
      name: expect.stringMatching(newProjectName),
      created_on: newProject.created_on,
      creator_id: expect.stringMatching(user.id),
      members: expect.any(Array),
      is_admin: expect.any(Boolean),
      position: expect.stringMatching(memberInfo.position)
    });

    newProject = response.body;
  });

  it('DELETE Prevent removal of a project if user doesn\'t have admin access', async () => {
    const response = await request(app)
      .delete(`/api/projects/${newProject.id}`)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${secondToken}`);

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      message: "Access denied"
    });
  });

  it('DELETE Remove a specific project', async () => {
    const response = await request(app)
      .delete(`/api/projects/${newProject.id}`)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toEqual(200);
  });
});
