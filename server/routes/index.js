import { Router } from "express";
import usersRouter from "./users";
import membersRouter from "./members";
import projectsRouter from "./projects";
import messagesRouter from "./messages";
import filesRouter from "./files";
import authRouter from "./auth";
import { verifyToken } from "../middleware/jwt";

const router = Router();

router.use("/auth", authRouter);

// prevent non-authenticated users from accessing below routes
router.use(verifyToken);
router.use("/users", usersRouter);
router.use("/projects/:id/members", membersRouter);
router.use("/projects/:id/messages", messagesRouter);
router.use("/projects/:id/files", filesRouter);
router.use("/projects", projectsRouter);

export default router;
