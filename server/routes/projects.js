import { Router } from "express";
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from "../controllers/ProjectController";

const router = Router();

/* GET projects for logged in user */
router.get("/", getProjects);

/* POST create a new project for logged in user */
router.post("/", createProject);

/* GET one project for logged in user */
router.get("/:id", getProjectById);

/* PUT update a specific project for logged in user  */
router.put("/:id", updateProject);

/* DELETE a specific project */
router.delete("/:id", deleteProject);

export default router;
