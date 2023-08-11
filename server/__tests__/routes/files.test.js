import request from 'supertest';
import app from '../../app';
import { addUser, addProjectMember, addProject } from "../utils/helpers";
import { projectInfo, newTestUserInfo, memberInfo, updatedTestUserInfo, updatedMemberInfo } from "../utils/testData";
import { generateAuthToken } from "../../middleware/jwt";
import path from "path";

describe('Files Routes', () => {
  let token, user, secondUser, secondToken, project, file;
  beforeAll(async () => {
    // create 2 new users in DB
    [user, secondUser] = await Promise.all([
      addUser({
        username: newTestUserInfo.username,
        firstName: newTestUserInfo.firstName,
        lastName: newTestUserInfo.lastName,
      }),
      addUser({
        username: updatedTestUserInfo.username,
        firstName: updatedTestUserInfo.firstName,
        lastName: updatedTestUserInfo.lastName,
      })
    ]);
    token = generateAuthToken(user.id);
    secondToken = generateAuthToken(secondUser.id);
    // add new project in DB
    project = await addProject({
      name: projectInfo.name,
      creatorId: user.id,
    });
    await addProjectMember({
      projectId: project.id,
      userId: user.id,
      position: "Director",
      isAdmin: true,
    });
  });

  it('POST Create a new file', async () => {
    const filePath = path.resolve(__dirname, "../assets/test.docx");

    const response = await request(app)
      .post(`/api/projects/${project.id}/files`)
      .attach("file", filePath)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`);

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toEqual(201);
    expect(response.body).toMatchObject({
      id: expect.any(String),
      creator_id: expect.stringMatching(user.id),
      created_on: expect.any(String),
      project_id: expect.stringMatching(project.id)
    });

    file = response.body;
  });

  it('GET Retrieve all files for a given project', async () => {
    const response = await request(app)
      .get(`/api/projects/${project.id}/files`)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`);

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toEqual(200);
    expect(response.body).toMatchObject({
      totalCount: expect.any(Number),
      files: expect.any(Array),
      offset: expect.any(Number),
    });
    expect(response.body.files).toHaveLength(1);
    expect(response.body.files[0]).toMatchObject(file);
  });

  it('PUT Update a file', async () => {
    const fileFields = {
      name: "A different file name",
    };
    const response = await request(app)
      .put(`/api/projects/${project.id}/files/${file.id}`)
      .send(fileFields)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`);

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toEqual(201);
    expect(response.body).toMatchObject({
      id: expect.any(String),
      creator_id: expect.stringMatching(user.id),
      created_on: expect.any(String),
      name: expect.stringMatching(fileFields.name),
      url: expect.stringMatching(file.url),
      project_id: expect.stringMatching(project.id)
    });

    file = response.body;
  });

  it('DELETE Remove a specific file', async () => {
    const response = await request(app)
      .delete(`/api/projects/${project.id}/files/${file.id}`)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toEqual(200);
  });
});
