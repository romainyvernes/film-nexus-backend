import { Router } from "express";
import usersRouter from "./users";
import projectsRouter from "./projects";

const router = Router();

router.use("/users", usersRouter);
router.use("/projects", projectsRouter);

export default router;
