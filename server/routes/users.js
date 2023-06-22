import { Router } from "express";
import {
  getAllUsers,
  getUserByUsername,
  updateUser,
  deleteUser,
} from "../controllers/UserController";

const router = Router();

/* GET all users */
router.get("/", getAllUsers);

/* GET one user */
router.get("/:username", getUserByUsername);

/* PUT update one user */
router.put("/:username", updateUser);

/* DELETE update one user */
router.delete("/:username", deleteUser);

export default router;
