import { Router } from "express";
import usersRouter from "./users";
import membersRouter from "./members";
import projectsRouter from "./projects";
import messagesRouter from "./messages";
import { verifyToken } from "../middleware/jwt";

const router = Router();

// prevent non-authenticated users from accessing below routes
router.use(verifyToken);
router.use("/users", usersRouter);
router.use("/projects/:id/members", membersRouter);
router.use("/projects/:id/messages", messagesRouter);
router.use("/projects", projectsRouter);

export default router;
