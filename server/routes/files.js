import { Router } from "express";
import { createFile, deleteFile, getFiles, updateFile } from "../controllers/FileController";

const router = Router({ mergeParams: true });

/* GET retrieve files */
router.get("/", getFiles);

/* POST create a new file */
router.post("/", createFile);

/* PUT update a file */
router.put("/:fileId", updateFile);

/* DELETE a file */
router.delete("/:fileId", deleteFile);

export default router;
