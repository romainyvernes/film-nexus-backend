import request from 'supertest';
import app from '../../app';
import { addProject, addUser, clearDb, populateDb } from "../utils/helpers";
import { incorrectPassword, newTestUserInfo, projectInfo, updatedTestUserInfo } from "../utils/testData";
import { generateAuthToken } from "../../middleware/jwt";

describe('Users Routes', () => {
  let user, token, secondUser, project;
  beforeAll(async () => {
    await clearDb();
    await populateDb();

    // create new user in DB
    user = await addUser({
      username: newTestUserInfo.username,
      firstName: newTestUserInfo.firstName,
      lastName: newTestUserInfo.lastName,
      password: newTestUserInfo.password,
    });
    token = generateAuthToken(user.id);
  });

  // tests to move to auth routes when ready
  // it('POST Attempting to create a user without required fields returns a 400 error', async () => {
  //   const response = await request(app)
  //     .post("/api/users")
  //     .send({
  //       username: newTestUserInfo.username,
  //       password: newTestUserInfo.password
  //     })
  //     .set('Accept', 'application/json');

  //   expect(response.headers["content-type"]).toMatch(/json/);
  //   expect(response.status).toBe(400);
  // });

  // it('POST Create a new user', async () => {
  //   const response = await request(app)
  //     .post("/api/users")
  //     .send(newTestUserInfo)
  //     .set('Accept', 'application/json');

  //   expect(response.headers["content-type"]).toMatch(/json/);
  //   expect(response.status).toBe(201);

  //   user = response.body;
  // });

  // it('POST Prevent the creation of a new user that already exists', async () => {
  //   const response = await request(app)
  //     .post("/api/users")
  //     .send(newTestUserInfo)
  //     .set('Accept', 'application/json');

  //   expect(response.status).toBe(401);
  //   expect(response.body).toMatchObject({
  //     message: expect.stringMatching("User already exists")
  //   });
  // });

  it('GET Search for users to add to a project w/o search criteria', async () => {
    // create a new user and project in DB
    [secondUser, project] = await Promise.all([
      addUser({ ...updatedTestUserInfo, username: "johnny_john" }),
      addProject({ ...projectInfo, creatorId: user.id })
    ]);

    const response = await request(app)
      .get(`/api/users`)
      .send({ projectId: project.id })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`);

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      page: expect.any(Number),
      users: expect.any(Array),
      totalCount: expect.any(Number)
    });
    expect(response.body.users[0]).toMatchObject({
      ...secondUser,
      created_on: expect.any(String),
    });
  });

  it('GET Search for users to add to a project w/ search criteria', async () => {
    // add another user to DB
    await addUser({
      username: "jackie_O",
      firstName: "Jackie",
      lastName: "O",
      password: "testy123"
    });

    const response = await request(app)
      .get(`/api/users?firstName=jo`)
      .send({ projectId: project.id })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`);

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      page: expect.any(Number),
      users: expect.any(Array),
      totalCount: expect.any(Number)
    });
    expect(response.body.users[0]).toMatchObject({
      ...secondUser,
      created_on: expect.any(String),
    });
  });

  it('GET Search for users w/o required fields', async () => {
    const response = await request(app)
      .get(`/api/users`)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`);

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      message: expect.any(String)
    });
  });

  it('GET Retrieve a specific user', async () => {
    const response = await request(app)
      .get(`/api/users/${user.id}`)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`);

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ...user,
      created_on: new Date(user.created_on).toISOString(),
    });
    expect(response.body.password).toBeUndefined();
  });

  it('GET Retrieve a specific user with unknown id', async () => {
    const response = await request(app)
      .get(`/api/users/unknown-id`)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`);

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      message: "User not found"
    });
  });

  it('PUT Prevent update of a specific user without proper credentials', async () => {
    const response = await request(app)
      .put(`/api/users/${user.id}`)
      .send({
        ...updatedTestUserInfo,
        currentPassword: incorrectPassword,
      })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
  });

  it('PUT Update a specific user with unknown id', async () => {
    const response = await request(app)
      .put(`/api/users/unknown-id`)
      .send({
        ...updatedTestUserInfo,
        currentPassword: newTestUserInfo.password,
        newPassword: updatedTestUserInfo.password
      })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`);

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      message: "User not found"
    });
  });

  it('PUT Prevent update of a specific user if username is taken', async () => {
    const response = await request(app)
      .put(`/api/users/${user.id}`)
      .send({
        ...updatedTestUserInfo,
        username: newTestUserInfo.username,
        currentPassword: newTestUserInfo.password,
        newPassword: updatedTestUserInfo.password,
      })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      message: "Username already taken"
    });
  });

  it('PUT Update a specific user with proper credentials', async () => {
    const response = await request(app)
      .put(`/api/users/${user.id}`)
      .send({
        ...updatedTestUserInfo,
        currentPassword: newTestUserInfo.password,
        newPassword: updatedTestUserInfo.password
      })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`);

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(200);
    expect(response.body.password).toBeUndefined();
  });

  it('DELETE Update a specific user with unknown id', async () => {
    const response = await request(app)
      .delete(`/api/users/unknown-id`)
      .send({
        currentPassword: updatedTestUserInfo.password
      })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`);

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      message: "User not found"
    });
  });

  it('DELETE Prevent removal of a specific user without credentials', async () => {
    const response = await request(app)
      .delete(`/api/users/${user.id}`)
      .send({
        currentPassword: incorrectPassword
      })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
  });

  it('DELETE Remove a specific user with proper credentials', async () => {
    const response = await request(app)
      .delete(`/api/users/${user.id}`)
      .send({
        currentPassword: updatedTestUserInfo.password
      })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
  });
});
