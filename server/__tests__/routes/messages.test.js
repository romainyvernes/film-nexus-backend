import request from 'supertest';
import app from '../../app';
import { addUser, addProjectMember, addProject } from "../utils/helpers";
import { projectInfo, newTestUserInfo, memberInfo, updatedTestUserInfo, updatedMemberInfo } from "../utils/testData";
import { generateAuthToken } from "../../middleware/jwt";

describe('Messages Routes', () => {
  let token, user, secondUser, secondToken, project, message;
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

  it('POST Create a new message', async () => {
    const messageFields = {
      text: "Some random message"
    };
    const response = await request(app)
      .post(`/api/projects/${project.id}/messages`)
      .send(messageFields)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`);

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toEqual(201);
    expect(response.body).toMatchObject({
      id: expect.any(String),
      creator_id: expect.stringMatching(user.id),
      created_on: expect.any(String),
      text: expect.stringMatching(messageFields.text),
      project_id: expect.stringMatching(project.id)
    });

    message = response.body;
  });

  it('GET Retrieve all messages for a given project', async () => {
    const response = await request(app)
      .get(`/api/projects/${project.id}/messages`)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`);

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toEqual(200);
    expect(response.body).toMatchObject({
      totalCount: expect.any(Number),
      messages: expect.any(Array),
      offset: expect.any(Number),
    });
    expect(response.body.messages).toHaveLength(1);
    expect(response.body.messages[0]).toMatchObject(message);
  });

  it('DELETE Remove a specific message', async () => {
    const response = await request(app)
      .delete(`/api/projects/${project.id}/messages/${message.id}`)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toEqual(200);
  });
});
