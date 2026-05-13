import { Request, Response } from "express";
import { UserNoIndex, UserSingleIndex, UserCompoundIndex } from "../models/user.model";
import mongoose from "mongoose";

// Utilitaire pour mesurer le temps d'exécution d'une fonction
const measureTime = async (fn: () => Promise<any>) => {
  const start = process.hrtime();
  await fn();
  const [seconds, nanoseconds] = process.hrtime(start);
  return seconds * 1000 + nanoseconds / 1000000;
};

export const getStatus = (req: Request, res: Response) => {
  res.json({
    status: "online",
    timestamp: new Date().toISOString(),
    message: "MongoDB Optimization API is ready",
    database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected"
  });
};

export const getCollections = async (req: Request, res: Response) => {
  try {
    const models = [
      { model: UserNoIndex, key: "no_index", label: "Aucun index", index: "—", color: "var(--chart-4)" },
      { model: UserSingleIndex, key: "single_index", label: "Index simple", index: "{ email: 1 }", color: "var(--chart-2)" },
      { model: UserCompoundIndex, key: "compound_index", label: "Index composé", index: "{ status: 1, createdAt: -1, email: 1 }", color: "var(--chart-3)" },
    ];

    const results = await Promise.all(models.map(async ({ model, key, label, index, color }) => {
      let stats;
      try {
        stats = await model.collection.stats();
      } catch (e) {
        // Si la collection n'existe pas encore
        stats = { totalIndexSize: 0 };
      }
      
      const count = await model.countDocuments();
      
      let status: "critical" | "warning" | "healthy" = "healthy";
      if (key === "no_index") status = "critical";
      else if (key === "single_index") status = "warning";

      return {
        key,
        name: model.collection.name,
        label,
        index,
        documents: count,
        indexSize: `${((stats.totalIndexSize || 0) / 1024 / 1024).toFixed(2)} MB`,
        color,
        status
      };
    }));

    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getResponseTime = async (req: Request, res: Response) => {
  try {
    // On cherche un utilisateur au hasard
    const count = await UserCompoundIndex.countDocuments();
    if (count === 0) {
      return res.json([
        { collection: "Aucun", min: 0, avg: 0, p95: 0, p99: 0, max: 0 },
        { collection: "Simple", min: 0, avg: 0, p95: 0, p99: 0, max: 0 },
        { collection: "Composé", min: 0, avg: 0, p95: 0, p99: 0, max: 0 },
      ]);
    }

    const randomUser = await UserCompoundIndex.findOne().skip(Math.floor(Math.random() * Math.min(count, 1000)));
    const email = randomUser?.email || "test@example.com";

    const models = [
      { model: UserNoIndex, collection: "Aucun" },
      { model: UserSingleIndex, collection: "Simple" },
      { model: UserCompoundIndex, collection: "Composé" },
    ];

    const results = await Promise.all(models.map(async ({ model, collection }) => {
      const times: number[] = [];
      for(let i=0; i<3; i++) { // Réduit à 3 pour plus de rapidité
        const time = await measureTime(() => model.findOne({ email }).lean());
        times.push(time);
      }

      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      return {
        collection,
        min: Math.min(...times),
        avg: parseFloat(avg.toFixed(2)),
        p95: Math.max(...times),
        p99: Math.max(...times),
        max: Math.max(...times)
      };
    }));

    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getExplain = async (req: Request, res: Response) => {
  try {
    const { strategy, email } = req.query;
    
    let model;
    if (strategy === "no_index") model = UserNoIndex;
    else if (strategy === "single_index") model = UserSingleIndex;
    else model = UserCompoundIndex;

    const explain = await model.find({ email: email as string }).explain("executionStats");
    // @ts-ignore - Les types Mongoose explain sont parfois complexes
    const stats = explain.executionStats || explain[0]?.executionStats;

    if (!stats) {
       return res.status(404).json({ error: "Stats explain non disponibles" });
    }

    res.json({
      stage: stats.executionStages?.stage || "UNKNOWN",
      totalDocsExamined: stats.totalDocsExamined,
      totalKeysExamined: stats.totalKeysExamined,
      executionTimeMillis: stats.executionTimeMillis,
      nReturned: stats.nReturned,
      raw: stats
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getTimeseries = async (req: Request, res: Response) => {
  // Génère des données de latence simulées
  const data = Array.from({ length: 30 }, (_, i) => ({
    t: i,
    no_index: 800 + Math.random() * 400,
    single_index: 10 + Math.random() * 15,
    compound_index: 2 + Math.random() * 5,
  }));
  res.json(data);
};

// --- CRUD ENDPOINTS ---

export const getUsers = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const users = await UserCompoundIndex.find()
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });
    const total = await UserCompoundIndex.countDocuments();
    res.json({ users, total, page, totalPages: Math.ceil(total / Number(limit)) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const userData = req.body;
    // On génère un ID unique partagé pour les 3 collections
    const _id = new mongoose.Types.ObjectId();
    const newUser = { ...userData, _id };

    const [user] = await Promise.all([
      UserNoIndex.create(newUser),
      UserSingleIndex.create(newUser),
      UserCompoundIndex.create(newUser),
    ]);
    res.status(201).json(user);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // On met à jour dans les 3 collections pour rester cohérent
    const [user] = await Promise.all([
      UserNoIndex.findByIdAndUpdate(id, req.body, { new: true }),
      UserSingleIndex.findByIdAndUpdate(id, req.body, { new: true }),
      UserCompoundIndex.findByIdAndUpdate(id, req.body, { new: true }),
    ]);

    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });
    res.json(user);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // On supprime des 3 collections
    const [user] = await Promise.all([
      UserNoIndex.findByIdAndDelete(id),
      UserSingleIndex.findByIdAndDelete(id),
      UserCompoundIndex.findByIdAndDelete(id),
    ]);

    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });
    res.json({ message: "Utilisateur supprimé avec succès" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
