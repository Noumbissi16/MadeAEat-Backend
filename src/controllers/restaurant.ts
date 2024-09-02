import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import {
  AdminRestaurant,
  Annonce,
  Menu,
  MenuOwner,
  Restaurant,
} from "../db/models/restaurant";
import { StatusCodes } from "http-status-codes";
import { BadRequest, NotFoundError, UnauthenticatedError } from "../errors";
import { IReq } from "../types";
import {
  deleteFileFromCloudinary,
  uploadToCloudinary,
} from "../middlewares/upload";

// Authentication controllers

// Creating restaurant administrator
export const signup = async (req: Request, res: Response) => {
  const adminRestaurant = await AdminRestaurant.create({
    ...req.body,
  });
  const token = adminRestaurant.createJWT();
  return res.status(StatusCodes.CREATED).json({
    msg: "Admin user created successfully",
    token,
    admin: adminRestaurant,
  });
};

export const createRestaurant = async (req: Request, res: Response) => {
  const { userId } = (req as IReq).user;
  // const { userId } = req.body;
  if (!userId) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Please provide your admin Id in request" });
  }
  const restaurant = await Restaurant.create({
    ...req.body,
    ownedBy: userId,
  });

  const administrator = await AdminRestaurant.findById(userId);
  const token = administrator?.createJWT();
  return res.status(StatusCodes.CREATED).json({
    msg: "Restaurant created successfully",
    restaurant,
    token,
  });
};

export const signin = async (req: Request, res: Response) => {
  const { password, email, nameRestaurant } = req.body;
  if (!password || !email || !nameRestaurant) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Please provide all fields" });
  }

  const adminRestaurant = await AdminRestaurant.findOne({ email });
  if (!adminRestaurant) {
    throw new UnauthenticatedError("Invalid email");
  }
  const isPasswordCorrect = await adminRestaurant?.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new UnauthenticatedError("Invalid password");
  }
  // check if restaurant exists
  const restaurant = await Restaurant.find({
    name: nameRestaurant,
    ownedBy: adminRestaurant?._id,
  });

  if (restaurant.length < 1) {
    throw new NotFoundError("You don't have a restaurant with this name");
  }

  const token = adminRestaurant.createJWT();
  return res.status(StatusCodes.OK).json({
    msg: "Login into restaurant account successfull",
    token,
  });
};

// Menu controllers
export const createMenuItem = async (req: Request, res: Response) => {
  // Extract the userId from the request object
  const { userId } = (req as any).user;
  const menuInfo = req.body;
  const imageMenu = req.file;
  if (imageMenu) {
    const cloudinaryResponse = await uploadToCloudinary(imageMenu);
    menuInfo.imageMenu = cloudinaryResponse.secure_url;
  }

  const menu = await Menu.create({
    ...menuInfo,
  });
  const restaurant = await Restaurant.findOne({
    ownedBy: userId,
  });
  await MenuOwner.create({
    menuID: menu?._id,
    restaurantID: restaurant?._id,
  });
  return res.status(StatusCodes.CREATED).json({ menu });
};

export const getAllRestaurantMenu = async (req: Request, res: Response) => {
  const { userId } = (req as any).user;

  const restaurantOfAdmin = await Restaurant.findOne({
    ownedBy: userId,
  });
  if (!restaurantOfAdmin) {
    res.status(StatusCodes.NOT_FOUND).json({
      msg: "No restaurnt found",
    });
  }
  const idMenus = await MenuOwner.find({
    restaurantID: restaurantOfAdmin?._id,
  });

  const menus = await Menu.find({
    _id: { $in: idMenus.map((menu) => menu.menuID) },
  });

  return res.status(StatusCodes.OK).json({ menus });
};

export const getMenuByID = async (req: Request, res: Response) => {
  const { userId } = (req as any).user;
  const { menuID } = req.params;
  const restaurantOfAdmin = await Restaurant.findOne({
    ownedBy: userId,
  });
  const menuId = await MenuOwner.findOne({
    restaurantID: restaurantOfAdmin?._id,
    menuID,
  });

  if (!menuId) {
    throw new BadRequest("You don't have a menu with such Id");
  }

  const menu = await Menu.findById(menuID);

  return res.status(StatusCodes.OK).json({
    menu,
  });
};

export const updateMenuItem = async (req: Request, res: Response) => {
  const { userId } = (req as any).user;
  const { menuID } = req.params;
  const restaurantOfAdmin = await Restaurant.findOne({
    ownedBy: userId,
  });
  const menuId = await MenuOwner.findOne({
    restaurantID: restaurantOfAdmin?._id,
    menuID,
  });

  if (!menuId) {
    throw new BadRequest("You don't have a menu with such Id");
  }
  const menuToUpdate = req.body;
  const imageMenu = req.file;
  if (imageMenu) {
    // Search for menu in database in order to delete it's image from cloudinary
    const menuFromDb = await Menu.findById(menuId);
    menuFromDb?.imageMenu && deleteFileFromCloudinary(menuFromDb.imageMenu);
    // upload new image to cloudinary and get it's url to save in Database
    const cloudinaryResponse = await uploadToCloudinary(imageMenu);
    menuToUpdate.imageMenu = cloudinaryResponse.secure_url;
  }

  const menu = await Menu.findByIdAndUpdate(
    {
      _id: menuID,
    },
    menuToUpdate,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!menu) {
    throw new NotFoundError("No menu found to update");
  }

  return res.status(StatusCodes.OK).json({
    menu,
  });
};

export const deleteMenuItem = async (req: Request, res: Response) => {
  const { userId } = (req as any).user;
  const { menuID } = req.params;
  const restaurantOfAdmin = await Restaurant.findOne({
    ownedBy: userId,
  });
  const menuId = await MenuOwner.findOneAndDelete({
    restaurantID: restaurantOfAdmin?._id,
    menuID,
  });

  if (!menuId) {
    throw new BadRequest("You don't have a menu with such Id");
  }

  const deletedMenu = await Menu.findByIdAndDelete({
    _id: menuID,
  });
  if (!deletedMenu) {
    throw new NotFoundError("No such menu exist");
  }
  if (deletedMenu.imageMenu) {
    await deleteFileFromCloudinary(deletedMenu.imageMenu);
  }

  return res.status(StatusCodes.OK).json({
    msg: "Menu deleted successfully",
  });
};

// Annonce controllers
export const createAnnonce = async (req: Request, res: Response) => {
  const { userId } = (req as any).user;

  const restaurantOfAdmin = await Restaurant.findOne({
    ownedBy: userId,
  });

  if (!restaurantOfAdmin) {
    throw new BadRequest("Please provide the creator of the annonce");
  }

  const annonce = await Annonce.create({
    ...req.body,
    createdBy: restaurantOfAdmin?._id,
  });

  return res.status(StatusCodes.CREATED).json({
    msg: "Annonce created successfully",
    annonce,
  });
};
export const getAnnonceByID = async (req: Request, res: Response) => {
  const { userId } = (req as any).user;
  const { annonceID } = req.params;
  const restaurantOfAdmin = await Restaurant.findOne({
    ownedBy: userId,
  });
  const annonce = await Annonce.findById({
    _id: annonceID,
    createdBy: restaurantOfAdmin?._id,
  });

  if (!annonce) {
    throw new NotFoundError(`No annonce with id ${annonceID} found`);
  }

  return res.status(StatusCodes.OK).json({
    annonce,
  });
};
export const updateAnnoceByID = async (req: Request, res: Response) => {
  const { userId } = (req as any).user;
  const { annonceID } = req.params;
  const restaurantOfAdmin = await Restaurant.findOne({
    ownedBy: userId,
  });
  const annonce = await Annonce.findByIdAndUpdate(
    {
      _id: annonceID,
      createdBy: restaurantOfAdmin?._id,
    },
    req.body,
    { new: true, runValidators: true }
  );

  if (!annonce) {
    throw new NotFoundError(`No annonce with id ${annonceID} found`);
  }

  return res.status(StatusCodes.OK).json({
    annonce,
  });
};
export const deleteAnnonceByID = async (req: Request, res: Response) => {
  const { userId } = (req as any).user;
  const { annonceID } = req.params;
  const restaurantOfAdmin = await Restaurant.findOne({
    ownedBy: userId,
  });
  const annonce = await Annonce.findByIdAndDelete({
    _id: annonceID,
    createdBy: restaurantOfAdmin?._id,
  });

  if (!annonce) {
    throw new NotFoundError(`No job with id ${annonceID}`);
  }

  return res.status(StatusCodes.OK).json();
};
export const getAllAnnonce = async (req: Request, res: Response) => {
  const { userId } = (req as any).user;
  const restaurantOfAdmin = await Restaurant.findOne({
    ownedBy: userId,
  });
  const annonce = await Annonce.find({
    createdBy: restaurantOfAdmin?._id,
  }).sort({ createdAt: -1 });
  return res.status(StatusCodes.OK).json({
    annonce,
  });
};

// Profile controllers
export const getRestaurantProfileInfos = async (
  req: Request,
  res: Response
) => {
  const { userId } = (req as any).user;

  const restaurant = await Restaurant.findOne({
    ownedBy: userId,
  });

  if (!restaurant) {
    throw new NotFoundError(`You don't yet have a restaurant`);
  }

  const updateRestaurant = await Restaurant.findByIdAndUpdate(
    {
      _id: restaurant?._id,
    },
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  return res.status(StatusCodes.OK).json({
    restaurant,
  });
};
export const updateRestaurantInfos = async (req: Request, res: Response) => {
  const { userId } = (req as any).user;

  const informationToUpdate = req.body;
  const profile = req.file;
  const restaurantToUpdate = await Restaurant.findOne({
    ownedBy: userId,
  });

  if (!restaurantToUpdate) {
    throw new NotFoundError(`You don't yet have a restaurant`);
  }
  if (profile) {
    // Delete the image from cloudinary in case the user already had an image before uploading the new one
    restaurantToUpdate.profile &&
      deleteFileFromCloudinary(restaurantToUpdate.profile);
    // upload new profile image to cloudinary
    const cloudinaryUpload = await uploadToCloudinary(profile);
    informationToUpdate.profile = cloudinaryUpload.secure_url;
  }

  const updatedRestaurant = await Restaurant.findByIdAndUpdate(
    {
      _id: restaurantToUpdate?._id,
    },
    informationToUpdate,
    {
      new: true,
      runValidators: true,
    }
  );

  return res.status(StatusCodes.OK).json({
    restaurant: updatedRestaurant,
  });
};

export const getRestaurantAdminInfos = async (req: Request, res: Response) => {
  const { userId } = (req as any).user;

  const admin = await AdminRestaurant.findById(userId);

  if (!admin) {
    throw new NotFoundError(`No admin found`);
  }

  return res.status(StatusCodes.OK).json({
    admin,
  });
};

export const updateRestaurantAdminInfos = async (
  req: Request,
  res: Response
) => {
  const { userId } = (req as any).user;

  const { password, ...updateInfos } = req.body;

  const adminProfile = req.file;

  const adminRestaurantToUpdate = await AdminRestaurant.findById(userId);

  if (!adminRestaurantToUpdate) {
    throw new NotFoundError("You don't have an account");
  }

  if (password) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    updateInfos.password = hashedPassword;
  }

  if (adminProfile) {
    // Delete the already existing user image on cloudinary if exist
    adminRestaurantToUpdate.profileImage &&
      deleteFileFromCloudinary(adminRestaurantToUpdate.profileImage);
    // upload new image to cloudinary and get url to save in database
    const cloudinaryUpload = await uploadToCloudinary(adminProfile);
    // Attach the image url to the object that will be saved in database
    updateInfos.profileImage = cloudinaryUpload.secure_url;
  }

  const updatedAdmin = await AdminRestaurant.findByIdAndUpdate(
    { _id: userId },
    updateInfos,
    {
      new: true,
    }
  );

  if (!updatedAdmin) {
    throw new NotFoundError(`No admin found with id ${userId}`);
  }

  return res.status(StatusCodes.OK).json({
    admin: updatedAdmin,
  });
};
