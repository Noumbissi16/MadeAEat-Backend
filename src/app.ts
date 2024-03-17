require("express-async-errors");
import express, { Application, Request, Response } from "express";
import dotenv from "dotenv";
import restaurantRouter from "./routes/restaurant";
import notFoundMiddleware from "./middlewares/not-found";
import errorHandlerMiddleware from "./middlewares/error-handler";
import connectDB from "./db/connectDB";
import authMiddleware from "./middlewares/authMiddleware";
import clientRouter from "./routes/client";
dotenv.config();
import path from "path";
import agenceRouter from "./routes/panelAgence";
const port = process.env.PORT || 8000;
const app: Application = express();
app.use(express.json());

// routes
app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to MadeAEat API");
});

app.use("/uploads", express.static(path.join(__dirname, "../", "uploads")));
// Restaurant
app.use("/api/v1/auth/restaurant", restaurantRouter);
app.use("/api/v1/restaurant", authMiddleware, restaurantRouter);
// Clients
app.use("/api/v1/auth/client", clientRouter);
app.use("/api/v1/client", authMiddleware, clientRouter);
// Agence
app.use("/api/v1/auth/agence", agenceRouter);
app.use("/api/v1/agence", authMiddleware, agenceRouter);

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

// const uri =
//   "mongodb+srv://Stael:The_glory@cluster0.nzcoapt.mongodb.net/MadeAEat?retryWrites=true&w=majority";

const uri = process.env.MONGODB_URI + "=true";
console.log(uri);

const startServer = async () => {
  try {
    uri && (await connectDB(uri));
    app.listen(port, () => {
      console.log("Server is listening on port", port);
    });
  } catch (error) {
    console.log(error);
  }
};

startServer();
