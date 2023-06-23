import { Router } from "express";
import {
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/UserController";

const router = Router();

/* GET one user */
router.get("/:id", getUserById);

/* PUT update one user */
router.put("/:id", updateUser);

/* DELETE update one user */
router.delete("/:id", deleteUser);

export default router;
