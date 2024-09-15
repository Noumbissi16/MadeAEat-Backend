import { Request, Response } from "express";
import Agence from "../db/models/panelAgence";
import { StatusCodes } from "http-status-codes";
import { BadRequest, NotFoundError, UnauthenticatedError } from "../errors";
import { Menu, MenuOwner, Restaurant } from "../db/models/restaurant";
import CommandeModel from "../db/models/commande";
import { ClientModel } from "../db/models/client";

export const signUpAgence = async (req: Request, res: Response) => {
  const agence = await Agence.create(req.body);
  const token = agence.createJWT();
  return res.status(StatusCodes.CREATED).json({ agence, token });
};

export const signInAgence = async (req: Request, res: Response) => {
  const agence = await Agence.findOne({ email: req.body.email });
  if (!agence) {
    throw new UnauthenticatedError(
      `No agence with email ${req.body.email} found`
    );
  }

  const isPasswordCorrect = await agence.comparePassword(req.body.password);

  if (!isPasswordCorrect) {
    throw new UnauthenticatedError("Invalid password, try again");
  }

  const token = agence.createJWT();
  return res.status(StatusCodes.OK).json({ msg: "OK", token });
};

export const getAllRestaurant = async (req: Request, res: Response) => {
  const restaurants = await Restaurant.find({}).select(
    "profile ville location ownedBy name"
  );
  return res
    .status(StatusCodes.OK)
    .json({ count: restaurants.length, restaurants });
};

export const getSingleRestaurantInformationById = async (
  req: Request,
  res: Response
) => {
  const userId = (req as any).user.userId;
  const agenceLocation = await Agence.findById(userId).select("agence");
  const { idRestaurant } = req.params;
  const restaurant = await Restaurant.findById({
    _id: idRestaurant,
    ville: agenceLocation?.agence,
  }).populate("ownedBy", "name email profileImage");
  if (!restaurant) {
    throw new NotFoundError(`No restaurant with id ${idRestaurant}`);
  }
  const menusID = await MenuOwner.find({
    restaurantID: restaurant._id,
  }).select("menuID");
  const menus = await Menu.find({
    _id: { $in: menusID.map((menu) => menu.menuID) },
  });

  const commandes = await CommandeModel.find({
    menuID: { $in: menusID.map((menu) => menu.menuID) },
  })
    .populate("clientID", "name profileImage")
    .populate("menuID", "name price");

  const restaurantInfos = {
    ...restaurant.toObject(),
    menus: menus.map((menu) => menu.toObject()),
    commandes: commandes.map((commande) => commande.toObject()),
  };

  return res.status(StatusCodes.OK).json({ restaurantInfos });
};

export const getAllUsersOfAgence = async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const agenceLocation = await Agence.findById(userId).select("agence");

  const users = await ClientModel.find({
    town: agenceLocation?.agence,
  }).select("name email profileImage phoneNumber");

  res.status(StatusCodes.OK).json({ users });
};

export const getAllCommandes = async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const agenceLocation = await Agence.findById(userId).select("agence");
  const restaurantsInLocation = await Restaurant.find({
    ville: agenceLocation?.agence,
  });

  const menusOfRestaurantInLocation = await MenuOwner.find({
    restaurantID: {
      $in: restaurantsInLocation.map((restaurant) => restaurant._id),
    },
  });

  const menusCommandedInLocation = await CommandeModel.find({
    menuID: { $in: menusOfRestaurantInLocation.map((menu) => menu._id) },
  })
    .populate("clientID", "profileImage name")
    .populate("menuID");

  return res.status(StatusCodes.OK).json({
    commande: menusCommandedInLocation,
  });
};

export const getSingleCommandeById = async (req: Request, res: Response) => {
  const { commandeId } = req.params;
  const commande = await CommandeModel.findById({
    _id: commandeId,
  });
  if (!commande) {
    throw new NotFoundError(`No commande with id ${commandeId} found`);
  }
  return res.status(StatusCodes.OK).json({
    commande,
  });
};
