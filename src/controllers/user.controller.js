import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/users.models.js";
import cloudinaryUpload from "../utils/cloudinary.js";
import { ApiResonse } from "../utils/Apiresponse.js";
import { response } from "express";

const registerUser = asyncHandler(async (req, res) => {
  console.log("came here");
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

  const existedUser = User.findOne({ $or: [{ email }, { userName }] });

  if (existedUser) {
    throw new ApiError(409, "User or email already exists");
  }
  const avatarLocalFilePath = req.files?.avatar[0]?.path;
  const coverImageLocalFilePath = req.files?.coverImage[0]?.path;

  if (!avatarLocalFilePath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await cloudinaryUpload(avatarLocalFilePath);
  const coverImage = await cloudinaryUpload(coverImageLocalFilePath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullName,
    avatar: Avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    userName: userName.toLowerCase(),
  });

  const createdUser = User.findById(user._id).select("-password -refreshToken");

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user");
  }

  return res
    .status(200)
    .json(new ApiResonse(200, createdUser, "user registered sucessfully"));
});

export { registerUser };
