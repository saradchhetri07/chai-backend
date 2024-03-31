import { Router } from "express";
import {
  addComment,
  deleteComment,
  editComment,
  getVideoComments,
} from "../controllers/comment.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route(":/videoId").get(getVideoComments).post(addComment);
router.route("/c/:commentId").delete(deleteComment).patch(editComment);

export default router;
