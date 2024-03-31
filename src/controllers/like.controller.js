import mongoose, { Mongoose } from "mongoose";
import { Like } from "../models/like.models.js";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResonse } from "../utils/Apiresponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?._id;
    const { videoId } = req.params?.videoId;

    const existingUser = await Like.findOne({
      video: videoId,
      likedBy: userId,
    });

    if (existingUser) {
      await Like.findOneAndDelete({ video: videoId, likedBy: userId });
    } else {
      const newLike = await Like.create({ video: videoId, likedBy: userId });
      console.log(newLike);
      newLike.save();
      return res
        .status(200)
        .json(new ApiResonse(200, newLike, "Liked the videos"));
    }
  } catch (error) {
    throw new ApiError(500, "Internal Server Error");
  }
});

const videoLike = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params.videoId;
    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiError(404, "video not found");
    }
    const videoLike = await Like.aggregate([
      {
        $match: {
          video: mongoose.Types.ObjectId(videoId),
        },
      },
      {
        $count: "totalLikes",
      },
    ]);

    return res
      .status(200)
      .json(new ApiResonse(200, videoLike, "liked fetched sucessfully"));
  } catch (error) {
    throw new ApiError(500, "Internal Server Error");
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?._id;
    const { commentId } = req.params.commentId;

    const existingUser = await Like.findOne({
      comment: commentId,
      likedBy: userId,
    });

    if (existingUser) {
      await Like.findOneAndDelete({ comment: commentId, likedBy: userId });
    } else {
      const newLike = await Like.create({
        comment: commentId,
        likedBy: userId,
      });
      console.log(newLike);
      newLike.save();
      return res
        .status(200)
        .json(new ApiResonse(200, newLike, "Liked the comment"));
    }
  } catch (error) {
    throw new ApiError(500, "Internal Server Error");
  }
});

const commentLike = asyncHandler(async (req, res) => {
  try {
    const { commentId } = req.params.commentid;
    const totalCommentLikes = await Like.aggregate([
      {
        $match: {
          comment: commentId,
        },
      },
      {
        $count: "totalCommentLikes",
      },
    ]);
    return res
      .status(200)
      .json(
        new ApiResonse(
          200,
          totalCommentLikes,
          "total comment Likes fetched sucessfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, "Internal Server Error");
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  try {
    const likedVideos = await Like.aggregate([
      {
        $group: {
          _id: "$video",
          likes: {
            $addToSet: "$likedBy",
          },
        },
      },
      {
        $project: {
          _id: 1,
          $count: {
            $size: "$likes",
          },
        },
      },
      {
        $lookup: {
          from: "videos",
          localField: "video",
          foreignField: "_id",
          as: "videoData",
          pipeline: [
            {
              $project: {
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                isPublished: 1,
                owner: 1,
              },
            },
          ],
        },
      },
      {
        $project: {
          _id: 1,
          $count: 1,
          videoData: { $arrayElemAt: ["$videoData", 0] },
        },
      },
    ]);

    return res
      .status(200)
      .json(new ApiResonse(200, likedVideos, "likedVideos"));
  } catch (error) {
    throw new ApiError(500, "Internal Server Error");
  }
});

export {
  videoLike,
  toggleVideoLike,
  toggleCommentLike,
  commentLike,
  getLikedVideos,
};
