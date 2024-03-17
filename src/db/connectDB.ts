import mongoose from "mongoose";

async function connectDB(url: string) {
  return await mongoose
    .connect(url)
    .then(() => console.log("Database connected successfully"));
}

export default connectDB;
