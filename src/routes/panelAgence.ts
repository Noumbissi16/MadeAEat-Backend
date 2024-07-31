import express from "express";
import {
  getAllCommandes,
  getAllRestaurant,
  getAllUsersOfAgence,
  getSingleCommandeById,
  getSingleRestaurantInformationById,
  signInAgence,
  signUpAgence,
} from "../controllers/panelAgence";

const agenceRouter = express.Router();

// Authentication routes
agenceRouter.post("/signup-agence", signUpAgence);
agenceRouter.post("/signin-agence", signInAgence);

// Restaurant routes
agenceRouter.get("/restaurants", getAllRestaurant);
agenceRouter.get(
  "/restaurant/:idRestaurant",
  getSingleRestaurantInformationById
);

// Users routes
agenceRouter.get("/users", getAllUsersOfAgence);

// Commande routes
agenceRouter.get("/commandes", getAllCommandes);
agenceRouter.get("/commande/:commandeId", getSingleCommandeById);

export default agenceRouter;
