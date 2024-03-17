import { Request, Response } from "express";
import { ClientModel } from "../db/models/client";
import { StatusCodes } from "http-status-codes";
import { NotFoundError, UnauthenticatedError } from "../errors";
import bcrypt from "bcryptjs";

import {
  AdminRestaurant,
  Annonce,
  Menu,
  MenuOwner,
  Restaurant,
} from "../db/models/restaurant";
import CommandeModel from "../db/models/commande";
import deleteFile from "../utils/deleteFile";

export const signup = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  const client = await ClientModel.create({
    email,
    password,
    name,
  });
  const token = client.createJWT();
  return res.status(StatusCodes.CREATED).json({
    msg: "User created successfully",
    token,
  });
};

export const signin = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const client = await ClientModel.findOne({ email });
  if (!client) {
    throw new UnauthenticatedError(
      `No user with this email ${email} found, please try again`
    );
  }
  const isPasswordCorrect = await client.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new UnauthenticatedError(
      "Invalid password, Try with the correct password"
    );
  }

  const token = client.createJWT();
  return res.status(StatusCodes.OK).json({ msg: "Ok", token });
};

// Restaurant and menu controllers
export const getAllRestaurantProfiles = async (req: Request, res: Response) => {
  const restaurants = await Restaurant.find().populate(
    "ownedBy",
    "-password -_id -__v"
  );

  return res.status(StatusCodes.OK).json({
    restaurants,
  });
};

export const getRestaurantById = async (req: Request, res: Response) => {
  const { restaurantID } = req.params;
  const foundRestaurant = await Restaurant.findById(restaurantID)
    .select("-__v -createdAt -updatedAt")
    .populate("ownedBy", "name email phoneNumber");
  const idMenuRestaurant = await MenuOwner.find({
    restaurantID,
  });
  const menus = await Menu.find({
    _id: { $in: idMenuRestaurant.map((menu) => menu.menuID) },
  });
  // Construct the response object with nested menus
  const restaurant = {
    ...foundRestaurant!.toObject(), // Convert the foundRestaurant to plain JavaScript object
    menus: menus.map((menu) => menu.toObject()), // Convert each menu to plain JavaScript object
  };
  return res.status(StatusCodes.OK).json({
    restaurant,
  });
};

export const getSingleRestaurantMenu = async (req: Request, res: Response) => {
  const { restaurantID, menuID } = req.params;
  // Find the menu owner document
  const menuOwner = await MenuOwner.findOne({ restaurantID, menuID }).select(
    "menuID restaurantID -_id"
  );

  if (!menuOwner) {
    throw new NotFoundError("No menu found with this id");
  }

  // Populate the menuID field to get the full menu document
  await menuOwner.populate("menuID");

  // Extract the menu and restaurantID from the populated menuOwner object
  const { menuID: menu } = menuOwner;

  // Return response with menu and restaurantID properties
  return res.status(StatusCodes.OK).json({ menu, restaurantID });
};

export const getAllAnnouncements = async (req: Request, res: Response) => {
  const announcements = await Annonce.find()
    .select("-createdAt -updatedAt")
    .populate("createdBy", "name profile");

  return res.status(StatusCodes.OK).json({
    announcements,
  });
};

// Profile controllers
export const getUserProfile = async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const user = await ClientModel.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }
  return res.status(StatusCodes.OK).json({
    user,
  });
};

export const updateUserProfile = async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { password, ...updateInfos } = req.body;
  const profileImage = req.file;
  if (password) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    updateInfos.password = hashedPassword;
  }
  if (profileImage) {
    const userToUpdate = await ClientModel.findById(userId);
    userToUpdate?.profileImage && deleteFile(userToUpdate?.profileImage);
    updateInfos.profileImage = profileImage.path;
  }
  const updatedUser = await ClientModel.findByIdAndUpdate(
    userId,
    { updateInfos },
    {
      new: true,
    }
  );
  if (!updatedUser) {
    throw new NotFoundError("User not found");
  }
  res.status(StatusCodes.OK).json({
    user: updatedUser,
  });
};

export const getAllUserCommands = async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const user = await ClientModel.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  const commands = await CommandeModel.find({ clientID: userId });

  return res.status(StatusCodes.OK).json({
    commands,
  });
};

export const makeCommand = async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const user = await ClientModel.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }
  const { menuID } = req.body;
  const menu = await Menu.findById(menuID);
  if (!menu) {
    throw new NotFoundError("Menu not found");
  }

  const newCommand = await CommandeModel.create({
    ...req.body,
    clientID: userId,
  });

  return res.status(StatusCodes.OK).json({
    newCommand,
  });
};
