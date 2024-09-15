// Import the necessary modules
import { Request, Response } from "express";
import { ClientModel } from "../db/models/client";
import { StatusCodes } from "http-status-codes";
import { NotFoundError, UnauthenticatedError } from "../errors";
import bcrypt from "bcryptjs";
import { Annonce, Menu, MenuOwner, Restaurant } from "../db/models/restaurant";
import CommandeModel from "../db/models/commande";

import {
  deleteFileFromCloudinary,
  uploadToCloudinary,
} from "../middlewares/upload";

// Define the signup controller
export const signup = async (req: Request, res: Response) => {
  // Extract the email, password, and name from the request body
  const { email, password, name } = req.body;

  // Create a new client using the ClientModel
  const client = await ClientModel.create({
    email,
    password,
    name,
  });

  // Create a JWT token for the client
  const token = client.createJWT();

  // Send the token and a success message back to the client
  return res.status(StatusCodes.CREATED).json({
    msg: "User created successfully",
    token,
  });
};

// Define the signin controller
export const signin = async (req: Request, res: Response) => {
  // Extract the email and password from the request body
  const { email, password } = req.body;

  // Find the client with the given email
  const client = await ClientModel.findOne({ email });

  // If no client is found, throw an UnauthenticatedError
  if (!client) {
    throw new UnauthenticatedError(
      `No user with this email ${email} found, please try again`
    );
  }

  // Compare the provided password with the client's hashed password
  const isPasswordCorrect = await client.comparePassword(password);

  // If the password is incorrect, throw an UnauthenticatedError
  if (!isPasswordCorrect) {
    throw new UnauthenticatedError(
      "Invalid password, Try with the correct password"
    );
  }

  // Create a JWT token for the client
  const token = client.createJWT();

  // Send the token and a success message back to the client
  return res.status(StatusCodes.OK).json({ msg: "Ok", token });
};

// Define the getAllRestaurantProfiles controller
export const getAllRestaurantProfiles = async (req: Request, res: Response) => {
  // Find all restaurants and populate the ownedBy field with only the necessary information
  const restaurants = await Restaurant.find().populate(
    "ownedBy",
    "-password -_id -__v"
  );

  // Send the restaurants back to the client
  return res.status(StatusCodes.OK).json({
    restaurants,
  });
};

// Define the getRestaurantById controller
export const getRestaurantById = async (req: Request, res: Response) => {
  // Extract the restaurantID from the request parameters
  const { restaurantID } = req.params;

  // Find the restaurant by its ID and populate the ownedBy field with only the necessary information
  const foundRestaurant = await Restaurant.findById(restaurantID)
    .select("-__v -createdAt -updatedAt")
    .populate("ownedBy", "name email phoneNumber");

  // Find all menu owners for the given restaurant
  const idMenuRestaurant = await MenuOwner.find({
    restaurantID,
  });

  // Find all menus that belong to the restaurant
  const menus = await Menu.find({
    _id: { $in: idMenuRestaurant.map((menu) => menu.menuID) },
  });

  // Construct the response object with nested menus
  const restaurant = {
    ...foundRestaurant!.toObject(), // Convert the foundRestaurant to plain JavaScript object
    menus: menus.map((menu) => menu.toObject()), // Convert each menu to plain JavaScript object
  };

  // Send the restaurant back to the client
  return res.status(StatusCodes.OK).json({
    restaurant,
  });
};

// Define the getSingleRestaurantMenu controller
export const getSingleRestaurantMenu = async (req: Request, res: Response) => {
  // Extract the restaurantID and menuID from the request parameters
  const { restaurantID, menuID } = req.params;

  // Find the menu owner document
  const menuOwner = await MenuOwner.findOne({ restaurantID, menuID }).select(
    "menuID restaurantID -_id"
  );

  // If no menu owner is found, throw a NotFoundError
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

// Define the getAllAnnouncements controller
export const getAllAnnouncements = async (req: Request, res: Response) => {
  // Find all announcements and populate the createdBy field with only the necessary information
  const announcements = await Annonce.find()
    .select("-createdAt -updatedAt")
    .populate("createdBy", "name profile");

  // Send the announcements back to the client
  return res.status(StatusCodes.OK).json({
    announcements,
  });
};

// Define the getUserProfile controller
export const getUserProfile = async (req: Request, res: Response) => {
  // Extract the userId from the request object
  const userId = (req as any).user.userId;

  // Find the user by its ID
  const user = await ClientModel.findById(userId);

  // If no user is found, throw a NotFoundError
  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Send the user back to the client
  return res.status(StatusCodes.OK).json({
    user,
  });
};

// Define the updateUserProfile controller
export const updateUserProfile = async (req: Request, res: Response) => {
  // Extract the userId from the request object
  const userId = (req as any).user.userId;

  // Extract the password and other update information from the request body
  const { password, ...updateInfos } = req.body;

  // Get the profile image from the request
  const profileImage = req.file;

  // If a password is provided, hash it using bcrypt
  if (password) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    updateInfos.password = hashedPassword;
  }

  // If a profile image is provided, upload it to Cloudinary and update the profileImage field
  if (profileImage) {
    // Get the user to update
    const userToUpdate = await ClientModel.findById(userId);

    // If the user has a profile image, delete it from Cloudinary
    userToUpdate?.profileImage &&
      deleteFileFromCloudinary(userToUpdate?.profileImage);

    // Upload the new profile image to Cloudinary
    const cloudinaryResponse = await uploadToCloudinary(profileImage);

    // Update the profileImage field with the secure URL from Cloudinary
    updateInfos.profileImage = cloudinaryResponse.secure_url;
  }

  // Update the user's profile
  const updatedUser = await ClientModel.findByIdAndUpdate(userId, updateInfos, {
    new: true,
  });

  // If no user is found, throw a NotFoundError
  if (!updatedUser) {
    throw new NotFoundError("User not found");
  }

  // Send the updated user back to the client
  res.status(StatusCodes.OK).json({
    user: updatedUser,
  });
};

// Define the getAllUserCommands controller
export const getAllUserCommands = async (req: Request, res: Response) => {
  // Extract the userId from the request object
  const userId = (req as any).user.userId;

  // Find the user by its ID
  const user = await ClientModel.findById(userId);

  // If no user is found, throw a NotFoundError
  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Find all commands for the given user
  const commands = await CommandeModel.find({ clientID: userId });

  // Send the commands back to the client
  return res.status(StatusCodes.OK).json({
    commands,
  });
};

// Define the makeCommand controller
export const makeCommand = async (req: Request, res: Response) => {
  // Extract the userId from the request object
  const userId = (req as any).user.userId;

  // Find the user by its ID
  const user = await ClientModel.findById(userId);

  // If no user is found, throw a NotFoundError
  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Extract the menuID from the request body
  const { menuID } = req.body;

  // Find the menu by its ID
  const menu = await Menu.findById(menuID);

  // If no menu is found, throw a NotFoundError
  if (!menu) {
    throw new NotFoundError("Menu not found");
  }

  // Create a new command
  const newCommand = await CommandeModel.create({
    ...req.body,
    clientID: userId,
  });

  // Send the new command back to the client
  return res.status(StatusCodes.OK).json({
    newCommand,
  });
};
