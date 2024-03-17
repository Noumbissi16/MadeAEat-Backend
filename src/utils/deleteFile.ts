import fs from "fs";

const deleteFile = (filePath: string) => {
  fs.unlink(filePath, (error) => {
    if (error) {
      throw error;
    }
  });
};

export default deleteFile;
