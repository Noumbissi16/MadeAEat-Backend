import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { IAgence } from "../../types";
const panelAgenceSchema = new mongoose.Schema<IAgence>({
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
  agence: {
    type: String,
    required: [true, "Please precise the agence"],
    // enum: ["Bafoussam", "Douala", "Yaounde", "Maroua"],
    // default: "Bafoussam",
  },
  profileImage: {
    type: String,
  },
  profileAgence: {
    type: String,
  }

});

const salt = 10;

panelAgenceSchema.pre("save", async function () {
  this.password = await bcrypt.hash(this.password, salt);
});

panelAgenceSchema.methods.comparePassword = async function (
  candidatePassword: string
) {
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  return isMatch;
};

panelAgenceSchema.methods.createJWT = function () {
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

const Agence = mongoose.model("PanelAgence", panelAgenceSchema);

export default Agence;
