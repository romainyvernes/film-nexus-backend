import { Router } from "express";
import { createMember, deleteMember, updateMember } from "../controllers/MemberController";

const router = Router({ mergeParams: true });

/* POST create a new member */
router.post("/", createMember);

/* PUT update a member */
router.put("/:memberId", updateMember);

/* DELETE a member */
router.delete("/:memberId", deleteMember);

export default router;
