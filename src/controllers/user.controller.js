import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async (req, res) => {
  console.log("came here");
  res.status(200).json({
    message: "its running",
  });
});

export { registerUser };
