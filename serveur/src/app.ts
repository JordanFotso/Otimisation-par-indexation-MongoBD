import express from "express";
import cors from "cors";
import helmet from "helmet";
import apiRoutes from "./routes/api.routes";
import { errorMiddleware } from "./middleware/error.middleware";
import { Metric } from "./models/metric.model";

const app = express();

// Middleware de logging de performance
app.use((req, res, next) => {
  const start = process.hrtime();
  
  res.on("finish", () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const latency = seconds * 1000 + nanoseconds / 1000000;
    
    const strategy = (req.query.strategy as string);
    
    // On enregistre si une stratégie est précisée (k6)
    if (strategy) {
      Metric.create({ strategy, latency }).catch(() => {});
    }
  });
  
  next();
});

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
