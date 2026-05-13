import express from "express";
import cors from "cors";
import helmet from "helmet";
import apiRoutes from "./routes/api.routes";
import { errorMiddleware } from "./middleware/error.middleware";

const app = express();

// Middlewares de base
app.use(helmet());
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
app.use(express.json());

// Routes
app.use("/api", apiRoutes);

// Gestion des erreurs
app.use(errorMiddleware);

export default app;
