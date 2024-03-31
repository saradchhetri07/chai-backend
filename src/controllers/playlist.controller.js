import mongoose, { Mongoose } from "mongoose";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { PlayList } from "../models/playlist.models";
import { Video } from "../models/video.models";
import { ApiResonse } from "../utils/Apiresponse";
import { response } from "express";

const createPlaylist = asyncHandler(async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      throw new ApiError(400, "Bad request,name field is empty");
    }
    if (!description) {
      throw new ApiError(400, "Bad request,description field is empty");
    }
    const playlist = await PlayList.create({
      name,
      description,
      owner: req.user?._id,
    });

    return res
      .status(200)
      .json(new ApiError(200, playlist, "playlist created successfully"));
  } catch (error) {
    throw new ApiError(500, "Internal Server Error");
  }
});

const getPlaylistById = asyncHandler(async (req, res) => {
  try {
    const { playlistId } = req.params.playlistId;

    const playlist = await PlayList.findById(playlistId);

    if (!playlist) {
      throw new ApiError(404, "No such playlist found");
    }
    return res
      .status(200)
      .json(new ApiError(200, playlist, "playlist found successfully"));
  } catch (error) {
    throw new ApiError(500, "Internal Server Error");
  }
});

const updatePlaylist = asyncHandler(async (req, res) => {
  try {
    const { name, description } = req.body;
    const playlistId = req.params.playlistId;

    const playlist = await PlayList.findById(playlistId);

    if (!playlist) {
      throw new ApiError(404, "No such playlist found");
    }
    const updatedPlaylist = await PlayList.findByIdAndUpdate(playlistId, {
      $set: {
        name,
        description,
      },
      $new: true,
    });

    return res
      .status(200)
      .json(
        new ApiResonse(200, updatedPlaylist, "playlist updated successfully")
      );
  } catch (error) {
    throw new ApiError(500, "Internal Server Error");
  }
});

const deletePlaylist = asyncHandler(async (req, res) => {
  try {
    const { playlistId } = req.params.playlistId;

    const playlist = await PlayList.findById(playlistId);

    if (!playlist) {
      throw new ApiError(404, "No such playlist");
    }
    const deletedplaylist = await PlayList.findByIdAndDelete(playlistId);
    if (!deletedplaylist) {
      throw new ApiError(409, "Deletion operation failed");
    }
    return res
      .status(200)
      .json(new ApiResonse(200, deletePlaylist, "deleted sucessfully"));
  } catch (error) {
    throw new ApiError(500, "Internal server error");
  }
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params.videoId;
    const { playlistId } = req.params.playlistId;

    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiError(404, "no such video");
    }
    const playlist = await PlayList.findById(playlistId);
    if (!playlist) {
      throw new ApiError(404, "no such playlist");
    }
    const isVideoPresent = await PlayList.aggregate([
      {
        $match: {
          _id: mongoose.Types.ObjectId(playlistId),
        },
      },
      {
        $addFields: {
          isPresent: {
            $cond: {
              if: { $in: [mongoose.Types.ObjectId(videoId), "$videos"] },
              then: true,
              else: false,
            },
          },
        },
      },
    ]);

    if (isVideoPresent.isPresent) {
      return res
        .status(200)
        .json(new ApiResonse(200, "Already added to playlist"));
    }

    const newplaylist = await PlayList.findById(playlistId);
    newplaylist.videos.push(videoId);
    newplaylist.save();
    return res
      .status(200)
      .json(new ApiResonse(200, newplaylist, "Added to playlist"));
  } catch (error) {
    throw new ApiError(500, "Internal server error");
  }
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params.videoId;
    const { playlistId } = req.params.playlistId;

    if (!videoId || !playlistId) {
      throw new ApiError(404, "video or playlist not found");
    }
    const isVideoPresent = await PlayList.aggregate([
      {
        $match: {
          _id: mongoose.Types.ObjectId(playlistId),
        },
      },
      {
        $addFields: {
          isPresent: {
            $cond: {
              if: { $in: [mongoose.Types.ObjectId(videoId), "$videos"] },
              then: true,
              else: false,
            },
          },
        },
      },
    ]);

    if (!isVideoPresent.isPresent) {
      throw new ApiError(404, "video not found in playlist");
    }

    const playlist = await PlayList.findById(playlistId);

    if (!playlist) {
      throw new ApiError(404, "playlist not found");
    }
    playlist.videos = playlist.videos.filter((video) => video !== videoId);
    playlist.save();
    return res
      .status(200)
      .json(new ApiResonse(200, playlist, "videos removed sucessfully"));
  } catch (error) {
    throw new ApiError(500, error?.message || "Internal server error");
  }
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params.userId;
    const playlist = await Playlist.findById({ owner: userId });
    if (!playlist) {
      throw new ApiError(404, "playlist not found");
    }
    return res
      .status(200)
      .json(new ApiResonse(200, playlist, "playlist created"));
  } catch (error) {
    throw new ApiError(500, error?.message || "Internal server error");
  }
});

export {
  createPlaylist,
  getPlaylistById,
  updatePlaylist,
  deletePlaylist,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  getUserPlaylists,
};
