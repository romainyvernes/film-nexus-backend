import { Router } from "express";
import { createFile, deleteFile, getFiles, updateFile } from "../controllers/FileController";
import { handleFileUpload } from "../middleware/fileUpload";

const router = Router({ mergeParams: true });

/* GET retrieve files */
router.get("/", getFiles);

/* POST create a new file */
router.post("/", handleFileUpload, createFile);

/* PUT update a file */
router.put("/:fileId", updateFile);

/* DELETE a file */
router.delete("/:fileId", deleteFile);

export default router;
