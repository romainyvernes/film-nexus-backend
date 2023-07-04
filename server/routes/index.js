import { Router } from "express";
import usersRouter from "./users";
import projectsRouter from "./projects";
import { verifyToken } from "../middleware/jwt";

const router = Router();

// prevent non-authenticated users from accessing below routes
router.use(verifyToken);
router.use("/users", usersRouter);
router.use("/projects", projectsRouter);

export default router;
