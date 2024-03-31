import mongoose, { Mongoose } from "mongoose";
import { Like } from "../models/like.models.js";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResonse } from "../utils/Apiresponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getVideoDurationInSeconds } from "get-video-duration";
import { cloudinaryUpload, cloudinaryDelete } from "../utils/cloudinary.js";

//returns duration of video
// async function getDuration(localFilePath) {
//   var totalDuration = 0;
//   try {
//     await getVideoDurationInSeconds(localFilePath).then((duration) => {
//       console.log(duration);
//       totalDuration = duration;
//     });
//   } catch (error) {
//     throw new ApiError(500, "Failed to get video duration");
//   }
//   return totalDuration;
// }

const uploadVideo = asyncHandler(async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) {
      throw new ApiError(400, "title is required");
    }
    if (!description) {
      throw new ApiError(400, "description is required");
    }

    //get file path
    const videoFilePath = req.files?.videoFile[0]?.path;
    const thumbnailFilePath = req.files?.thumbnail[0]?.path;

    console.log(videoFilePath + thumbnailFilePath);

    if (!videoFilePath) {
      throw new ApiError(404, "Upload video file");
    }
    if (!thumbnailFilePath) {
      throw new ApiError(404, "Upload thumbnail file");
    }
    // const totalDuration = getDuration(videoFilePath);
    const totalDuration = await getVideoDurationInSeconds(videoFilePath);

    console.log("totalDuration" + totalDuration);
    //if both file present upload to cloudinary
    const videoFileUpload = await cloudinaryUpload(videoFilePath);
    const thumbnailFileUpload = await cloudinaryUpload(thumbnailFilePath);

    const video = await Video.create({
      videoFile: videoFileUpload?.url,
      thumbnail: thumbnailFileUpload?.url,
      title,
      description,
      duration: totalDuration,
      owner: req.user?._id,
    });

    return res
      .status(200)
      .json(new ApiResonse(200, video, "video has been created"));
  } catch (error) {
    throw new ApiError(500, "Internal Server Error");
  }
});

const getAllVideos = asyncHandler(async (req, res) => {
  try {
    const videos = await Video.find();
    if (!videos) {
      throw new ApiError(404, "No Videos");
    }
    return res
      .status(200)
      .json(new ApiResonse(200, videos, "Videos fetched successfully"));
  } catch (error) {
    throw new ApiError(500, "Internal server error");
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params.videoId;

    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiError(404, "Video not found");
    }
    return res
      .status(200)
      .json(new ApiResonse(200, video, "video fetched sucessfully"));
  } catch (error) {
    throw new ApiError(500, "Internal Server error");
  }
});

const deleteVideo = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params.videoId;
    const deletedVideo = await Video.findByIdAndDelete(videoId);
    if (!deletedVideo) {
      throw new ApiError(500, "deletion failed");
    }
  } catch (error) {
    throw new ApiError(500, "Internal Server error");
  }
});

const updateVideo = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params.videoId;
    const { thumbnail, title, description } = req.body;
    const video = await Video.findByIdAndUpdate(videoId, {
      $set: {
        thumbnail,
        title,
        description,
      },
      $new: true,
    });
    if (!video) {
      throw new ApiError(500, "video not updated");
    }
    return res
      .status(200)
      .json(new ApiResonse(200, video, "video updated sucessfully"));
  } catch (error) {
    throw new ApiError(500, "Internal server error");
  }
});

export { uploadVideo, getAllVideos, getVideoById, deleteVideo, updateVideo };
