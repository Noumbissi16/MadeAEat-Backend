import express from "express";
import {
  signUp,
  signIn,
  getAllAgenceRestaurant,
  createAgence,
  getRestaurantsOfAgenceByIdAgence,
  getRestaurantOfAgenceByIdAgenceAndRestaurant,
  getAllAgencesUser,
  getAllUsersOfAgenceByIdAgence,
} from "../controllers/agenceCentral";

const agenceCentralRouter = express.Router();

// Authentication
agenceCentralRouter.post("/signup", signUp);
agenceCentralRouter.post("/signin", signIn);

// Agence Routes
agenceCentralRouter.get("/agences", getAllAgenceRestaurant);
agenceCentralRouter.post("/agences", createAgence);
agenceCentralRouter.get(
  "/agences/:agenceId/restaurants",
  getRestaurantsOfAgenceByIdAgence
);
agenceCentralRouter.get(
  "/agences/:agenceId/restaurants/:restaurantId",
  getRestaurantOfAgenceByIdAgenceAndRestaurant
);

// User Routes
agenceCentralRouter.get("/agences/users", getAllAgencesUser);
agenceCentralRouter.get(
  "/agences/:agenceId/users",
  getAllUsersOfAgenceByIdAgence
);

export default agenceCentralRouter;
