 import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { IGenericUser } from "../../types";
const agenceCentralSchema = new mongoose.Schema<IGenericUser>({
  name: {
    type: String,
    required: [true, "Please provide your name"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Please provide email"],
    match: [
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      "Please provide a valid email",
    ],
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, "Please provide a secured password"],
    minlength: 6,
    trim: true,
  },
  profileImage: {
    type: String,
  },
});

const salt = 10;

agenceCentralSchema.pre("save", async function () {
  this.password = await bcrypt.hash(this.password, salt);
});

agenceCentralSchema.methods.comparePassword = async function (
  candidatePassword: string
) {
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  return isMatch;
};

agenceCentralSchema.methods.createJWT = function () {
  return jwt.sign(
    {
      userId: this._id,
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: process.env.JWT_LIFETIME!,
    }
  );
};

const AgenceCentral = mongoose.model("AgenceCentral", agenceCentralSchema);

export default AgenceCentral;
