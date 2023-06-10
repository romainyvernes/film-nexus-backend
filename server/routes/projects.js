import { Router } from "express";
import ProjectController from "../controllers/ProjectController";

const router = Router({ mergeParams: true });

/* GET projects for logged in user */
router.get("/", ProjectController.getProjects);

/* POST create a new project for logged in user */
router.post("/", ProjectController.createProject);

/* GET one project for logged in user */
router.get("/:projectId", ProjectController.getProject);

/* PUT update a specific project for logged in user  */
router.put("/:projectId", ProjectController.updateProject);

/* DELETE a specific project */
router.delete("/:projectId", ProjectController.deleteProject);

export default router;
