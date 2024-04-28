import { Request } from "express";
import multer from "multer";

import fs from "fs";

const uploadDirectory = "uploads";

// Ensure the upload directory exists
// if (!fs.existsSync(uploadDirectory)) {
//   fs.mkdirSync(uploadDirectory);
// }

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: Function) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    console.log("Unsupported file format, please upload an image file");
    cb(null, false);
  }
};

const upload = multer({ storage: fileStorage, fileFilter: fileFilter });

export default upload;
