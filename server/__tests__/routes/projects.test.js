// import request from 'supertest';
import app from '../../app';
import ProjectModel from '../../models/Project';
import { Pool } from 'pg';

// describe('Projects Routes', () => {
//   let pool;

//   beforeAll(async () => {
//     pool = new Pool({
//       connectionString: 'postgresql://username:password@localhost:5432/myapp_testing',
//     });

//     await pool.query('CREATE TABLE IF NOT EXISTS projects (id SERIAL PRIMARY KEY, name TEXT, description TEXT)');
//   });

//   afterAll(async () => {
//     await pool.query('DROP TABLE IF EXISTS projects');
//     await pool.end();
//   });

//   it('should get all projects', async () => {
//     // Test code for getting all projects
//   });

//   it('should create a new project', async () => {
//     // Test code for creating a new project
//   });

//   it('should get a specific project', async () => {
//     // Test code for getting a specific project
//   });

//   it('should update a specific project', async () => {
//     // Test code for updating a specific project
//   });

//   it('should delete a specific project', async () => {
//     // Test code for deleting a specific project
//   });
// });
