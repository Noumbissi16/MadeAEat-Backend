import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { IAdminRestaurant } from "../../types";

const adminRestaurantSchema = new mongoose.Schema<IAdminRestaurant>({
  name: {
    type: String,
    required: [true, "Please your name"],
    trim: true,
    minlength: [3, "Please, name must be at least 3 characters"],
    maxlength: [32, "Please, name is can't be more than 32 characters"],
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
  phoneNumber: {
    type: String,
  },
});

adminRestaurantSchema.pre("save", async function () {
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

adminRestaurantSchema.methods.comparePassword = async function (
  candidatePassword: string
) {
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  return isMatch;
};
adminRestaurantSchema.methods.createJWT = function () {
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

const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name for your restaurant"],
      trim: true,
    },
    ville: {
      type: String,
      required: [
        true,
        "Must precise the town where your restaurant is located",
      ],
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    ownedBy: {
      type: mongoose.Types.ObjectId,
      ref: "AdminRestaurant",
      required: [true, "Please precise the owner of this restaurant"],
    },
    phoneNumber: {
      type: String,
    },
    openingHour: {
      type: String,
    },
    closingHour: {
      type: String,
    },
    openingDays: {
      type: [String],
    },
    profile: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const menuSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name for your menu"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    imageMenu: {
      type: String,
    },
    price: {
      type: Number,
      required: [true, "Please precise a price for your menu"],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const menuOwnerSchema = new mongoose.Schema({
  menuID: {
    type: mongoose.Types.ObjectId,
    ref: "Menu",
    required: [true, "Please precise the menu referenced"],
  },
  restaurantID: {
    type: mongoose.Types.ObjectId,
    ref: "Restaurant",
    required: [true, "Please precise the restaurant publishing this menu"],
  },
});

const annonceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      require: [true, "Please provide a title for your announce"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Please provide description for your announce"],
      trim: true,
    },
    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: "Restaurant",
      required: [true, "Please precise the restaurant publishing this anounce"],
    },
  },
  {
    timestamps: true,
  }
);

// Export models
export const Restaurant = mongoose.model("Restaurant", restaurantSchema);
export const Menu = mongoose.model("Menu", menuSchema);
export const Annonce = mongoose.model("Annonce", annonceSchema);
export const MenuOwner = mongoose.model("MenuOwner", menuOwnerSchema);
export const AdminRestaurant = mongoose.model(
  "AdminRestaurant",
  adminRestaurantSchema
);
