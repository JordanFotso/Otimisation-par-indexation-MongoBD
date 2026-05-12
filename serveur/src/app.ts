import express from "express";
import cors from "cors";
import helmet from "helmet";
import apiRoutes from "./routes/api.routes";
import { errorMiddleware } from "./middleware/error.middleware";

const app = express();

// Middlewares de base
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", apiRoutes);

// Gestion des erreurs
app.use(errorMiddleware);

export default app;
