import mongoose, { Mongoose } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import { cloudinaryUpload, cloudinaryDelete } from "../utils/cloudinary.js";
import { ApiResonse } from "../utils/Apiresponse.js";
import { response } from "express";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  //get details from user
  // set up validation logic - not empty
  // check if user already exists: username,email
  // check for images
  //check for avatar
  // upload them cloudinary
  // create user object - create entry call in db
  //remove password and refresh token field from response
  // check for user creation
  // if created user then return response
  //else return null
  const { userName, email, fullName, password } = req.body;
  if (
    [userName, email, fullName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({ $or: [{ email }, { userName }] });

  if (existedUser) {
    throw new ApiError(409, "User or email already exists");
  }

  const avatarLocalFilePath = req.files?.avatar[0]?.path;
  let coverImageLocalFilePath = "";
  if (req.files?.coverImage) {
    let coverImageLocalFilePath = req.files?.coverImage[0]?.path;
  }

  if (!avatarLocalFilePath) {
    throw new ApiError(400, "Avatar local file is required");
  }

  const avatar = await cloudinaryUpload(avatarLocalFilePath);
  const coverImageUrl = await cloudinaryUpload(coverImageLocalFilePath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file not uploaded");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImageUrl?.url || "",
    email,
    password,
    userName: userName.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user");
  }

  return res
    .status(200)
    .json(new ApiResonse(200, createdUser, "user registered sucessfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  //get email and password field
  //check if they are empty or not
  //if empty return error
  //else compare it with the one in the database if email or password doesnt match
  //if match send login sucessfull message

  const { email, password, userName } = req.body;

  if (!email && !userName) {
    throw new ApiError(400, "Email or userName is required");
  }

  const user = await User.findOne({ $or: [{ email }, { userName }] });

  if (!user) {
    throw new ApiError(404, "User with such email or userName doesnt exist");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    return res.status(401).json(new ApiError(401, "Invalid credentials"));
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResonse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In successfully"
      )
    );
});

const logOutUser = asyncHandler(async (req, res) => {
  //   //clear cookies
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResonse(200, {}, "User logged out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies?.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(401, "Unauthorized access");
    }

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id).select("-password");

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (user?.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user?._id
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResonse(
          200,
          { accessToken, refreshToken },
          "AccessToken Refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refreshToken");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { newPassword, oldPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    throw new ApiError(400, "New password and confirm password didnt match");
  }

  const user = await User.findById(req.user?._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Ivalid password");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResonse(200, {}, "Password changed sucessfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(200, req.user, "User fetched sucessfully");
});

const updateUserDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName && !email) {
    throw new ApiError(400, "enter details to update");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResonse(200, user, "User details updated succesfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  try {
    const avatarLocalFilePath = req.file?.path;

    if (!avatarLocalFilePath) {
      throw new ApiError(400, "select files");
    }

    //upload the image
    const avatar = await cloudinaryUpload(avatarLocalFilePath);

    console.log("user avatar" + req.user.avatar);

    // //delete the image
    const deleteFromCloudinary = await cloudinaryDelete(req.user?.avatar);

    if (!avatar.url) {
      throw new ApiError(400, "files not uploaded");
    }

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          avatar: avatar.url,
        },
      },
      {
        new: true,
      }
    ).select("-password");

    return res
      .status(200)
      .json(new ApiResonse(200, user, "user avatar updated sucessfully"));
  } catch (error) {
    throw new ApiError(400, "cannot update avatar image");
  }
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalFilePath = req.file?.path;

  if (!coverImageLocalFilePath) {
    throw new ApiError(400, "cover Image file is missing");
  }
  const coverImage = await cloudinaryUpload(coverImageLocalFilePath);

  const deleteFromCloudinary = await cloudinaryDelete(req.user?.coverImage);

  if (!coverImage.url) {
    throw new ApiError(400, "coverImage not uploaded");
  }
  const user = await user
    .findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          coverImage: coverImage.url,
        },
      },
      {
        new: true,
      }
    )
    .select("-password");

  return res
    .status(200)
    .json(new ApiResonse(200, user, "coverImage updated sucessfully"));
});

const getChannelProfileDetails = asyncHandler(async (req, res) => {
  const { userName } = req.params;

  if (!userName) {
    throw new ApiError(400, "Username is required");
  }

  const channel = await User.aggregate([
    {
      $match: {
        userName: userName?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "channelSubscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        chanelSubscritedToCount: {
          $size: "$channelSubscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        userName: 1,
        subscribersCount: 1,
        chanelSubscritedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);


  if (!channel?.length) {
    throw new ApiError(404, "Channel doesnt exist");
  }
  return res
    .status(200)
    .json(new ApiResonse(200, channel[0], "Channel fetched sucessfully"));
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: new mongoose.Types.ObjectId(req.user?._id),
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "videos",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    userName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResonse(
        200,
        user[0].watchHistory,
        "watchHistory fetched sucessfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logOutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateUserDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getChannelProfileDetails,
  getWatchHistory,
};
