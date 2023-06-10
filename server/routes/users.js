import { Router } from "express";
import UserController from "../controllers/UserController";

const router = Router();

/* GET all users */
router.get("/", UserController.getUsers);

/* GET one user */
router.get("/:username", UserController.getUser);

/* PUT update one user */
router.put("/:username", UserController.updateUser);

/* DELETE update one user */
router.delete("/:username", UserController.deleteUser);

export default router;
