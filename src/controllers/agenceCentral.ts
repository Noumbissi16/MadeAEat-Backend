import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { BadRequest, NotFoundError, UnauthenticatedError } from "../errors";
import { Menu, MenuOwner, Restaurant } from "../db/models/restaurant";
import CommandeModel from "../db/models/commande";
import { ClientModel } from "../db/models/client";
import AgenceCentral from "../db/models/agenceCentral";
import Agence from "../db/models/panelAgence";
import { uploadToCloudinary } from "../middlewares/upload";

export const signUp = async (req: Request, res: Response) => {
  const agence = await AgenceCentral.create(req.body);
  const token = agence.createJWT();
  return res.status(StatusCodes.CREATED).json({ agence, token });
};

export const signIn = async (req: Request, res: Response) => {
  const agence = await AgenceCentral.findOne({ email: req.body.email });
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

export const getAllAgenceRestaurant = async (req: Request, res: Response) => {
  const agences = await Agence.find({}).select("profileImage agence name");
  return res.status(StatusCodes.OK).json({ count: agences.length, agences });
};

export const createAgence = async (req: Request, res: Response) => {
  let imageAgence = req.file;

  if (imageAgence) {
    const cloudinaryResponse = await uploadToCloudinary(imageAgence);
    imageAgence = cloudinaryResponse.secure_url;
  }

  const agence = await Agence.create({
    ...req.body,
    profileImage: imageAgence,
  });

  return res.status(StatusCodes.CREATED).json({ agence });
};

export const getRestaurantsOfAgenceByIdAgence = async (
  req: Request,
  res: Response
) => {
  const { agenceId } = req.params;
  const foundAgence = await Agence.findById(agenceId);

  if (!foundAgence) {
    throw new NotFoundError(`No agence with id ${agenceId} found`);
  }

  const restaurantsOfAgence = await Restaurant.find({
    ville: foundAgence.agence,
  });

  return res.status(StatusCodes.OK).json({
    restaurant: restaurantsOfAgence,
    agence: foundAgence,
    count: restaurantsOfAgence.length,
  });
};

export const getRestaurantOfAgenceByIdAgenceAndRestaurant = async (
  req: Request,
  res: Response
) => {
  const { agenceId, restaurantId } = req.params;

  const foundAgence = await Agence.findById(agenceId).select("restaurant");
  if (!foundAgence) {
    throw new NotFoundError(`No agence with id ${agenceId} found`);
  }
  const foundRestaurant = await Restaurant.findById({
    _id: restaurantId,
    ville: foundAgence.agence,
  }).populate("ownedBy", "name email profileImage");

  if (!foundRestaurant) {
    throw new NotFoundError(
      `No resturant with id ${restaurantId} found for this agence`
    );
  }

  const menusIdOfRestaurantId = await MenuOwner.find({
    restaurantID: foundRestaurant._id,
  }).select("menuID");

  const menusOfRestaurant = await Menu.find({
    _id: { $in: menusIdOfRestaurantId.map((menu) => menu.menuID) },
  });

  const commandes = await CommandeModel.find({
    menuID: { $in: menusOfRestaurant.map((menu) => menu._id) },
  })
    .where("status")
    .equals("accepted");

  const restaurantInfos = {
    commandes: {
      ...commandes,
      count: commandes.length,
    },
    restaurant: foundRestaurant,
    menus: menusOfRestaurant,
  };

  return res.status(StatusCodes.OK).json(restaurantInfos);
};

export const getAllAgencesUser = async (req: Request, res: Response) => {
  const agences = await Agence.find({}).select("profileImage agence name");
  return res.status(StatusCodes.OK).json({ count: agences.length, agences });
};

export const getAllUsersOfAgenceByIdAgence = async (
  req: Request,
  res: Response
) => {
  const { agenceId } = req.params;
  const foundAgence = await Agence.findById(agenceId);

  if (!foundAgence)
    throw new NotFoundError(`No agence with id ${agenceId} found`);

  const users = await ClientModel.find({
    town: foundAgence.agence,
  }).select("name email profileImage phoneNumber");
  return res.status(StatusCodes.OK).json({
    users,
  });
};
