import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  toggleVideoLike,
  videoLike,
  toggleCommentLike,
  commentLike,
  getLikedVideos,
} from "../controllers/like.controller.js";

const router = Router();
router.use(verifyJWT);

router.route("/toggle/v/:videoId").post(toggleVideoLike);
router.route("/toggle/v/:videoId").get(videoLike);
router.route("/toggle/c/:commentId").post(toggleCommentLike).get(commentLike);
router.route("/videos").get(getLikedVideos);

export default router;
