import { Router } from "express";
import {
  getUserById,
  updateUser,
  deleteUser,
  getUsers,
} from "../controllers/UserController";

const router = Router();

/* GET search for users to add to a project */
router.get("/", getUsers);

/* GET one user */
router.get("/:id", getUserById);

/* PUT update one user */
router.put("/:id", updateUser);

/* DELETE update one user */
router.delete("/:id", deleteUser);

export default router;
