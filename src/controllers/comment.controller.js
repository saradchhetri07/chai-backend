import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import { Comment } from "../models/comment.models.js";
import { ApiResonse } from "../utils/Apiresponse.js";
import { response } from "express";

const addComment = asyncHandler(async (req, res) => {
  //get the content of comment
  const { content } = req.body?.content;

  if (!content) {
    throw new ApiError(400, "content is empty");
  }

  const { videoId } = req.params?.videoId;

  if (!videoId) {
    throw new ApiError(400, "No video found to comment on");
  }

  const comment = await Comment.create({
    content,
    owner: req.user?._id,
    video: videoId,
  });

  comment.save();

  return res
    .status(200)
    .json(new ApiResonse(200, comment, "comment saved successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params.commentId;

  try {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new ApiError(400, "Comment not found");
    }
    await Comment.findByIdAndDelete(commentId);

    return res
      .staus(200)
      .json(new ApiResonse(200, "comment deleted successfully"));
  } catch (error) {
    throw new ApiError(401, error?.message || "error while deleting comment");
  }
});

const editComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params.commentId;
  const content = req.params.content;

  try {
    const comment = Comment.findById(commentId);
    if (!comment) {
      throw new ApiError(400, "comments not found");
    }
    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      {
        $set: {
          content,
        },
      },
      { new: true }
    );

    return res
      .status(200)
      .json(new ApiResonse(200, comment, "Comment updated successfully"));
  } catch (error) {
    throw new ApiError(401, error?.message || "error while deleting comment");
  }
});

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params.videoId;

  try {
    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiError(401, "video not found");
    }

    const comments = await Comment.aggregate([
      {
        $match: {
          video: mongoose.Types.ObjectId(videoId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $addFields: {
          userAvatar: {
            $arrayElemAt: ["$user.avatar", 0],
          },
          userName: {
            $arrayElemAt: ["$user.userName", 0],
          },
          createdBefore: "$createdAt",
        },
      },
      {
        $project: {
          userName: 1,
          content: 1,
          userAvatar: 1,
          createdBefore: 1,
        },
      },
    ]);

    return res
      .status(200)
      .json(new ApiResonse(200, comments, "comments fetched sucessfully"));
  } catch (error) {
    throw new ApiError(
      401,
      error?.message || "failed to fetch comments sucessfully"
    );
  }
});
export { addComment, deleteComment, editComment, getVideoComments };
