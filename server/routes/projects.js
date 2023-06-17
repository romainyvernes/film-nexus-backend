import { Router } from "express";
import {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from "../controllers/ProjectController";

const router = Router();

/* GET projects for logged in user */
router.get("/", getAllProjects);

/* POST create a new project for logged in user */
router.post("/", createProject);

/* GET one project for logged in user */
router.get("/:projectId", getProjectById);

/* PUT update a specific project for logged in user  */
router.put("/:projectId", updateProject);

/* DELETE a specific project */
router.delete("/:projectId", deleteProject);

export default router;
