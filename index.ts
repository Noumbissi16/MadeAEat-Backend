// Import the necessary modules.
require("express-async-errors");
import express, { Application, Request, Response } from "express";
// import dotenv from "dotenv";
require("dotenv").config();
import restaurantRouter from "./src/routes/restaurant";
import notFoundMiddleware from "./src/middlewares/not-found";
import errorHandlerMiddleware from "./src/middlewares/error-handler";
import connectDB from "./src/db/connectDB";
import authMiddleware from "./src/middlewares/authMiddleware";
import clientRouter from "./src/routes/client";
// dotenv.config();
import path from "path";
import agenceRouter from "./src/routes/panelAgence";
// security
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
// Swagger
import swaggerUI from "swagger-ui-express";
import YAML from "yamljs";
// const swaggerDocument = YAML.load("./swagger.yaml");
const swaggerDocument = require("./swagger.json");

// Set the port number.
const port = process.env.PORT || 8000;

// Create an Express application.
const app: Application = express();

// security
app.use(cors());
app.use(helmet());

// Parse JSON requests.
app.use(express.json());

// use ratelimit
app.set("trust proxy", 1 /* number of proxies between user and server */);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  })
);
// Define the root route.
app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to MadeAEat API");
});
// Serve Documentation
app.use(
  "/api-docs",
  swaggerUI.serve,
  swaggerUI.setup(swaggerDocument, {
    customCss:
      ".swagger-ui .opblock .opblock-summary-path-description-wrapper { align-items: center; display: flex; flex-wrap: wrap; gap: 0 10px; padding: 0 10px; width: 100%; }",

    customCssUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.3.0/swagger-ui.min.css",
    // "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.0.0/swagger-ui.min.css",
  })
);
// Serve static files from the uploads directory.
app.use("/uploads", express.static(path.join(__dirname, "/", "uploads")));

// Define the routes for the restaurant module.
app.use("/api/v1/auth/restaurant", restaurantRouter);
app.use("/api/v1/restaurant", authMiddleware, restaurantRouter);

// Define the routes for the client module.
app.use("/api/v1/auth/client", clientRouter);
app.use("/api/v1/client", authMiddleware, clientRouter);

// Define the routes for the agence module.
app.use("/api/v1/auth/agence", agenceRouter);
app.use("/api/v1/agence", authMiddleware, agenceRouter);

// Define the not found middleware.
app.use(notFoundMiddleware);

// Define the error handler middleware.
app.use(errorHandlerMiddleware);

// Get the MongoDB URI from the environment variables.
const uri = process.env.MONGODB_URI;

// Start the server.
const startServer = async () => {
  try {
    // Connect to the MongoDB database.
    await connectDB(uri!);
    // Listen on the specified port.
    app.listen(port, () => {
      console.log("Server is listening on port", port);
    });
  } catch (error) {
    console.log(error);
  }
};

// Start the server.
startServer();

export default app;
