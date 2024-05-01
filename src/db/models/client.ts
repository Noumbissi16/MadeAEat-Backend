import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { IClient } from "../../types";

const clientSchema = new mongoose.Schema<IClient>(
  {
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
    phoneNumber: {
      type: String,
      trim: true,
    },
    profileImage: {
      type: String,
    },
    town: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const saltRounds = 10;

clientSchema.pre("save", async function () {
  // const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, saltRounds);
});

clientSchema.methods.comparePassword = async function (
  candidatePassword: string
) {
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  return isMatch;
};
clientSchema.methods.createJWT = function () {
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

export const ClientModel = mongoose.model("Client", clientSchema);
