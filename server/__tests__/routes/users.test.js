// import request from 'supertest';
import app from '../../app';
import UserModel from '../../models/User';
import { Pool } from 'pg';

// describe('Users Routes', () => {
//   let pool;

//   beforeAll(async () => {
//     pool = new Pool({
//       connectionString: 'postgresql://username:password@localhost:5432/myapp_testing',
//     });

//     await pool.query('CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, name TEXT, email TEXT)');
//   });

//   afterAll(async () => {
//     await pool.query('DROP TABLE IF EXISTS users');
//     await pool.end();
//   });

//   it('should get all users', async () => {
//     // Test code for getting all users
//   });

//   it('should create a new user', async () => {
//     // Test code for creating a new user
//   });

//   it('should get a specific user', async () => {
//     // Test code for getting a specific user
//   });

//   it('should update a specific user', async () => {
//     // Test code for updating a specific user
//   });

//   it('should delete a specific user', async () => {
//     // Test code for deleting a specific user
//   });
// });
