import request from 'supertest';
import app from '../../app';
import pool from "../../db";
import { clearDb, populateDb } from "../utils/helpers";
import { incorrectPassword, newTestUserInfo, updatedTestUserInfo } from "../utils/testData";

describe('Users Routes', () => {
  beforeAll(async () => {
    await populateDb();
  });

  afterAll(async () => {
    await clearDb();
    await pool.end();
  });

  let newUser;

  it('POST Attempting to create a user without required fields returns a 400 error', async () => {
    const response = await request(app)
      .post("/api/users")
      .send({
        username: newTestUserInfo.username,
        password: newTestUserInfo.password
      })
      .set('Accept', 'application/json');

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(400);
  });

  it('POST Create a new user', async () => {
    const response = await request(app)
      .post("/api/users")
      .send(newTestUserInfo)
      .set('Accept', 'application/json');

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(201);

    newUser = response.body;
  });

  it('POST Prevent the creation of a new user that already exists', async () => {
    const response = await request(app)
      .post("/api/users")
      .send(newTestUserInfo)
      .set('Accept', 'application/json');

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      message: expect.stringMatching("User already exists")
    });
  });

  it('GET Retrieve a specific user', async () => {
    const response = await request(app)
      .get(`/api/users/${newUser.id}`)
      .set('Accept', 'application/json');

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(200);
    expect(response.body).toEqual(newUser);
    expect(response.body.password).toBeUndefined();
  });

  it('GET Retrieve a specific user with unknown id', async () => {
    const response = await request(app)
      .get(`/api/users/unknown-id`)
      .set('Accept', 'application/json');

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      message: "User not found"
    });
  });

  it('PUT Prevent update of a specific user without proper credentials', async () => {
    const response = await request(app)
      .put(`/api/users/${newUser.id}`)
      .send({
        ...updatedTestUserInfo,
        currentPassword: incorrectPassword,
      })
      .set('Accept', 'application/json');

    expect(response.status).toBe(403);
  });

  it('PUT Update a specific user with proper credentials', async () => {
    const response = await request(app)
      .put(`/api/users/${newUser.id}`)
      .send({
        ...updatedTestUserInfo,
        currentPassword: newTestUserInfo.password,
        newPassword: updatedTestUserInfo.password
      })
      .set('Accept', 'application/json');

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(200);
    expect(response.body.password).toBeUndefined();
  });

  it('PUT Update a specific user with unknown id', async () => {
    const response = await request(app)
      .put(`/api/users/unknown-id`)
      .send({
        ...updatedTestUserInfo,
        currentPassword: newTestUserInfo.password,
        newPassword: updatedTestUserInfo.password
      })
      .set('Accept', 'application/json');

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      message: "User not found"
    });
  });

  it('DELETE Update a specific user with unknown id', async () => {
    const response = await request(app)
      .delete(`/api/users/unknown-id`)
      .send({
        currentPassword: updatedTestUserInfo.password
      })
      .set('Accept', 'application/json');

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      message: "User not found"
    });
  });

  it('DELETE Prevent removal of a specific user without credentials', async () => {
    const response = await request(app)
      .delete(`/api/users/${newUser.id}`)
      .send({
        currentPassword: incorrectPassword
      })
      .set('Accept', 'application/json');

    expect(response.status).toBe(403);
  });

  it('DELETE Remove a specific user with proper credentials', async () => {
    const response = await request(app)
      .delete(`/api/users/${newUser.id}`)
      .send({
        currentPassword: updatedTestUserInfo.password
      })
      .set('Accept', 'application/json');

    expect(response.status).toBe(200);
  });
});
