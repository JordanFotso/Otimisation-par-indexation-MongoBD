import { Router } from "express";
import * as apiController from "../controllers/api.controller";

const router = Router();

// Routes Monitoring & Benchmark
router.get("/benchmark/run", apiController.runBenchmark);
router.get("/test", apiController.performTest);
router.get("/status", apiController.getStatus);
router.get("/collections", apiController.getCollections);
router.get("/metrics/response-time", apiController.getResponseTime);
router.get("/metrics/throughput", apiController.getThroughput);
router.get("/metrics/timeseries", apiController.getTimeseries);
router.get("/scenarios", apiController.getScenarios);
router.get("/explain", apiController.getExplain);

// CRUD Utilisateurs
router.get("/users", apiController.getUsers);
router.post("/users", apiController.createUser);
router.patch("/users/:id", apiController.updateUser);
router.delete("/users/:id", apiController.deleteUser);

export default router;
