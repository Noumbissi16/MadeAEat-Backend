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

// Authentication controllers
export const signup = async (req: Request, res: Response) => {
  const adminRestaurant = await AdminRestaurant.create({
    ...req.body,
  });
  const token = adminRestaurant.createJWT();
  return res.status(StatusCodes.CREATED).json({
    msg: "User created successfully",
    token,
  });
};

export const createRestaurant = async (req: Request, res: Response) => {
  const { userId } = (req as IReq).user;
  const restaurant = await Restaurant.create({
    ...req.body,
    ownedBy: userId,
  });
  return res.status(StatusCodes.CREATED).json({
    msg: "Restaurant created successfully",
    restaurant,
  });
};

export const signin = async (req: Request, res: Response) => {
  const { password, email, nameRestaurant } = req.body;
  if (!password || !email || !nameRestaurant) {
    res
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
    msg: "Ok",
    token,
  });
};

// Menu controllers
export const createMenuItem = async (req: Request, res: Response) => {
  const { userId } = (req as any).user;
  const imageMenu = req.file;
  const menu = await Menu.create({
    ...req.body,
    imageMenu: imageMenu?.path,
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

  const menu = await Menu.findByIdAndUpdate(
    {
      _id: menuID,
    },
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

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

  await Menu.findByIdAndDelete({
    _id: menuID,
  });

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
    throw new NotFoundError(`No job with id ${annonceID}`);
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
    throw new NotFoundError(`No job with id ${annonceID}`);
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

  console.log(req.file);

  const restaurant = await Restaurant.findOne({
    ownedBy: userId,
  });

  if (!restaurant) {
    throw new NotFoundError(`You don't yet have a restaurant`);
  }

  const updatedRestaurant = await Restaurant.findByIdAndUpdate(
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
  if (password) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    updateInfos.password = hashedPassword;
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
