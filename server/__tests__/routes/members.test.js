import request from 'supertest';
import app from '../../app';
import { addUser, addProjectMember, addProject } from "../utils/helpers";
import { projectInfo, newTestUserInfo, memberInfo, updatedTestUserInfo, updatedMemberInfo } from "../utils/testData";
import { generateAuthToken } from "../../middleware/jwt";

describe('Members Routes', () => {
  let token, user, secondUser, secondToken, project;
  beforeAll(async () => {
    // create 2 new users in DB
    [user, secondUser] = await Promise.all([
      addUser({
        username: newTestUserInfo.username,
        firstName: newTestUserInfo.firstName,
        lastName: newTestUserInfo.lastName,
        password: newTestUserInfo.password,
      }),
      addUser({
        username: updatedTestUserInfo.username,
        firstName: updatedTestUserInfo.firstName,
        lastName: updatedTestUserInfo.lastName,
        password: updatedTestUserInfo.password,
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

  it('POST Prevent adding a member without admin access to the project', async () => {
    const response = await request(app)
      .post(`/api/projects/${project.id}/members`)
      .send({
        position: memberInfo.position,
        isAdmin: true,
        memberId: secondUser.id
      })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${secondToken}`);

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toEqual(401);
    expect(response.body).toEqual({
      message: "Access denied"
    });
  });

  it('POST Prevent adding a member if required fields are missing', async () => {
    const response = await request(app)
      .post(`/api/projects/${project.id}/members`)
      .send({
        position: memberInfo.position,
        memberId: secondUser.id
      })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`);

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toEqual(400);
    expect(response.body).toEqual({
      message: expect.any(String)
    });
  });

  it('POST Prevent adding a member if data is incorrectly formatted', async () => {
    const response = await request(app)
      .post(`/api/projects/${project.id}/members`)
      .send({
        position: memberInfo.position,
        memberId: secondUser.id,
        isAdmin: ""
      })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`);

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toEqual(400);
    expect(response.body).toEqual({
      message: expect.any(String)
    });
  });

  it('POST Add a new member to a project', async () => {
    const response = await request(app)
      .post(`/api/projects/${project.id}/members`)
      .send({
        position: memberInfo.position,
        isAdmin: false,
        memberId: secondUser.id
      })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`);

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toEqual(201);
    expect(response.body).toEqual({
      project_id: expect.stringMatching(project.id),
      user_id: expect.stringMatching(secondUser.id),
      is_admin: false,
      position: expect.stringMatching(memberInfo.position),
    });
  });

  it('POST Prevent adding the same member twice', async () => {
    const response = await request(app)
      .post(`/api/projects/${project.id}/members`)
      .send({
        position: memberInfo.position,
        isAdmin: false,
        memberId: secondUser.id
      })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`);

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toEqual(401);
    expect(response.body).toEqual({
      message: "User is already a member"
    });
  });

  it('PUT Prevent update of a member if required fields are missing', async () => {
    const response = await request(app)
      .put(`/api/projects/${project.id}/members/${secondUser.id}`)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`);

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toEqual(400);
    expect(response.body).toEqual({
      message: expect.any(String)
    });
  });

  it('PUT Prevent update of a member if data is incorrectly formatted', async () => {
    const response = await request(app)
      .put(`/api/projects/${project.id}/members/${secondUser.id}`)
      .send({
        isAdmin: 35,
      })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`);

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toEqual(400);
    expect(response.body).toEqual({
      message: expect.any(String)
    });
  });

  it('PUT Update a specific member', async () => {
    const response = await request(app)
      .put(`/api/projects/${project.id}/members/${secondUser.id}`)
      .send({
        position: updatedMemberInfo.position,
      })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`);

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      project_id: expect.stringMatching(project.id),
      user_id: expect.stringMatching(secondUser.id),
      is_admin: false,
      position: expect.stringMatching(updatedMemberInfo.position),
    });
  });

  it('PUT Prevent update of a member without admin access to the project', async () => {
    const response = await request(app)
      .put(`/api/projects/${project.id}/members/${secondUser.id}`)
      .send({
        isAdmin: true,
      })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${secondToken}`);

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toEqual(401);
    expect(response.body).toEqual({
      message: "Access denied"
    });
  });

  it('DELETE Remove a specific member', async () => {
    const response = await request(app)
      .delete(`/api/projects/${project.id}/members/${secondUser.id}`)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toEqual(200);
  });

  it('DELETE Prevent removal of a member without admin access', async () => {
    const response = await request(app)
      .delete(`/api/projects/${project.id}/members/${user.id}`)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${secondToken}`);

    expect(response.status).toEqual(401);
    expect(response.body).toEqual({
      message: "Access denied"
    });
  });
});
