import { Request, Response } from "express";
import { UserNoIndex, UserSingleIndex, UserCompoundIndex } from "../models/user.model";
import { Metric } from "../models/metric.model";
import mongoose from "mongoose";
import { exec } from "child_process";

// ... (code existant)

export const runBenchmark = async (req: Request, res: Response) => {
  const { rps, duration } = req.body;
  const cmd = `docker compose run --rm -e API_URL=http://api:3001/api k6 run /scripts/benchmark.js`;

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return res.status(500).json({ error: error.message });
    }
    res.json({ output: stdout });
  });
};
  await fn();
  const [seconds, nanoseconds] = process.hrtime(start);
  const latency = seconds * 1000 + nanoseconds / 1000000;
  
  // Enregistrement en base de manière asynchrone
  Metric.create({ strategy, latency }).catch(console.error);
  
  return latency;
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
      let totalIndexSize = 0;
      let stats;
      try {
        stats = await mongoose.connection.db?.command({ collStats: model.collection.name });
        totalIndexSize = stats?.totalIndexSize || 0;
      } catch (e) {
        totalIndexSize = 0;
      }
      
      const count = await model.countDocuments();
      
      // Calcul dynamique du statut :
      // 1. Critical si pas d'index (no_index)
      // 2. Warning si index mais latence potentiellement élevée (simplifié ici par la taille)
      // 3. Healthy si index et bonne performance
      let status: "critical" | "warning" | "healthy" = "healthy";
      if (key === "no_index") {
        status = "critical";
      } else if (key === "single_index" && totalIndexSize > 1024 * 1024 * 500) { 
        // Warning si index simple dépasse 500MB
        status = "warning";
      }

      return {
        key,
        name: model.collection.name,
        label,
        index,
        documents: count,
        indexSize: `${(totalIndexSize / 1024 / 1024).toFixed(2)} MB`,
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
      for(let i=0; i<3; i++) {
        const time = await measureAndSaveTime(model, collection, () => model.findOne({ email }).lean());
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
    const { strategy, ...filters } = req.query;
    
    let model;
    if (strategy === "no_index") model = UserNoIndex;
    else if (strategy === "single_index") model = UserSingleIndex;
    else model = UserCompoundIndex;

    // Construction dynamique de la requête
    const query: any = {};
    if (filters.email) query.email = filters.email;
    if (filters.status) query.status = filters.status;
    if (filters.createdAt) query.createdAt = { $gte: new Date(filters.createdAt as string) };

    // Mesurer aussi l'explain
    const start = Date.now();
    const explain = await model.find(query).explain("executionStats");
    const latency = Date.now() - start;
    
    // Enregistrer la métrique
    Metric.create({ strategy: strategy as string, latency }).catch(console.error);

    // @ts-ignore
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

export const getScenarios = async (req: Request, res: Response) => {
  res.json([
    {
      id: "S1",
      name: "Recherche par email",
      method: "GET",
      path: "/api/users?email=:email",
      description: "Lookup unique sur un champ indexable haute cardinalité.",
      filters: ["email"],
    },
    {
      id: "S2",
      name: "Filtres multiples",
      method: "GET",
      path: "/api/users?status=active&createdAt=...",
      description: "Filtre composé status + plage de date de création.",
      filters: ["status", "createdAt"],
    },
    {
      id: "S3",
      name: "Tri + pagination",
      method: "GET",
      path: "/api/users?status=active&sort=-createdAt&page=42",
      description: "Requête complexe combinant filtre, tri descendant et pagination.",
      filters: ["status", "createdAt", "email"],
    },
  ]);
};


export const getTimeseries = async (req: Request, res: Response) => {
  try {
    const rawData = await Metric.find().sort({ createdAt: -1 }).limit(90);
    const data = Array.from({ length: 30 }, (_, i) => {
      const slice = rawData.slice(i * 3, i * 3 + 3);
      return {
        t: i,
        no_index: slice.find(d => d.strategy === "Aucun")?.latency || 0,
        single_index: slice.find(d => d.strategy === "Simple")?.latency || 0,
        compound_index: slice.find(d => d.strategy === "Composé")?.latency || 0,
      };
    }).reverse();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
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
