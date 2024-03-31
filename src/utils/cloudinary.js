import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ApiError } from "./ApiError.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const cloudinaryUpload = async (localFilePath) => {
  try {
    if (!localFilePath || localFilePath.length === 0) return null;
    //upload to cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    console.log("file been uploaded to cloudinary" + response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
  }
};

// const cloudinaryVideoUpload = async (localFilePath) => {
//   try {
//     if (!localFilePath || localFilePath.length === 0) return null;
//     //upload to cloudinary
//     const response = await cloudinary.uploader.upload_large(localFilePath, {
//       resource_type: "video",
//     });
//     console.log("file been uploaded to cloudinary" + response.url);
//     fs.unlinkSync(localFilePath);
//     return response;
//   } catch (error) {
//     fs.unlinkSync(localFilePath);
//   }
// };

const getPublicId = (publicUrl) => {
  const lastIndex = publicUrl.lastIndexOf("/");

  // If '/' is found, extract the substring after it
  let substring = publicUrl.substring(lastIndex + 1); // or url.slice(lastIndex + 1);

  // Find the index of the last occurrence of '.' in the substring
  const extensionIndex = substring.lastIndexOf(".");

  // If '.' is found, remove the extension
  if (extensionIndex !== -1) {
    substring = substring.substring(0, extensionIndex); // or substring.slice(0, extensionIndex);
  }
  return substring;
};

const cloudinaryDelete = async (publicUrl) => {
  try {
    const publicId = getPublicId(publicUrl);
    console.log(publicId);
    //upload to cloudinary
    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
    });

    return response;
  } catch (error) {
    throw new ApiError(500, error.message || "unable to delete from server");
  }
};

export { cloudinaryUpload, cloudinaryDelete };
