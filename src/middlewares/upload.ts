import { Request } from "express";
import multer from "multer";
import cloudinary from "../utils/config/cloudinaryConfig";

// Define the file storage configuration
const fileStorage = multer.diskStorage({
  // Define the filename for the uploaded files
  filename: function (req, file, cb) {
    // Generate a unique suffix for the filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    // Combine the unique suffix with the original filename
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

// Define the file filter to validate the uploaded files
const fileFilter = (req: Request, file: Express.Multer.File, cb: Function) => {
  // Check if the file is an image
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    // If the file is an image, accept it
    cb(null, true);
  } else {
    // If the file is not an image, reject it
    console.log("Unsupported file format, please upload an image file");
    cb(
      new Error(
        "Unsupported file format, please upload an image file of format png or jpg or jpeg"
      ),
      false
    );
  }
};

// Define the function to upload the file to Cloudinary
const uploadToCloudinary = async (file: Express.Multer.File) => {
  try {
    // Upload the file to Cloudinary
    const result = await cloudinary.uploader.upload(file.path, {
      folder: "/madeAEat",
      use_filename: true,
    });
    return result;
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    throw error;
  }
};

// Define the function to extract the public ID from the secure URL
function extractPublicId(secureUrl: string) {
  // Split the secure URL by '/'
  const parts = secureUrl.split("/");
  // Find the part containing the public ID
  const publicIdPart = parts[parts.length - 1];
  // Remove the file extension
  const publicId = publicIdPart.split(".")[0];
  return publicId;
}

// Define the function to delete the file from Cloudinary
const deleteFileFromCloudinary = async (secure_url: string) => {
  try {
    // Delete the file from Cloudinary
    const publicId = extractPublicId(secure_url);
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Error deleting file from Cloudinary:", error);
    throw error;
  }
};

// Define the multer upload configuration
const upload = multer({
  storage: fileStorage,
  fileFilter: fileFilter,
});

// Export the upload, uploadToCloudinary, and deleteFileFromCloudinary functions
export { upload, uploadToCloudinary, deleteFileFromCloudinary };
