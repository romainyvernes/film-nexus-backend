import { Router } from "express";
import { createMessage, deleteMessage, getMessages } from "../controllers/MessageController";

const router = Router({ mergeParams: true });

/* GET retrieve messages */
router.get("/", getMessages);

/* POST create a new message */
router.post("/", createMessage);

/* DELETE a message */
router.delete("/:messageId", deleteMessage);

export default router;
