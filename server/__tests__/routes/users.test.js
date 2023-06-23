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

  it('POST Create a new user', async () => {
    const response = await request(app)
      .post("/api/users")
      .send(newTestUserInfo)
      .set('Accept', 'application/json');

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toEqual(201);

    newUser = response.body;
  });

  it('GET Retrieve a specific user', async () => {
    const response = await request(app)
      .get(`/api/users/${newUser.id}`)
      .set('Accept', 'application/json');

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toEqual(200);
    expect(response.body).toEqual(newUser);
    expect(response.body.password).toBeUndefined();
  });

  it('PUT Prevent update of a specific user without credentials', async () => {
    const response = await request(app)
      .put(`/api/users/${newUser.id}`)
      .send({
        ...updatedTestUserInfo,
        currentPassword: incorrectPassword,
      })
      .set('Accept', 'application/json');

    expect(response.status).toEqual(500);
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
    expect(response.status).toEqual(200);
    expect(response.body.password).toBeUndefined();
  });

  it('DELETE Prevent removal of a specific user without credentials', async () => {
    const response = await request(app)
      .delete(`/api/users/${newUser.id}`)
      .set('Accept', 'application/json');

    expect(response.status).toEqual(500);
  });

  it('DELETE Remove a specific user with proper credentials', async () => {
    const response = await request(app)
      .delete(`/api/users/${newUser.id}`)
      .send({
        currentPassword: updatedTestUserInfo.password
      })
      .set('Accept', 'application/json');

    expect(response.status).toEqual(200);
  });
});
