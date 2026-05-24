import { Request, Response } from "express";
import { UserNoIndex, UserSingleIndex, UserCompoundIndex } from "../models/user.model";
import { Metric } from "../models/metric.model";
import mongoose from "mongoose";
import { spawn } from "child_process";

// Utilitaire pour mesurer le temps d'exécution et enregistrer le résultat
const measureAndSaveTime = async (model: any, strategy: string, fn: () => Promise<any>) => {
  const start = process.hrtime();
  await fn();
  const [seconds, nanoseconds] = process.hrtime(start);
  const latency = seconds * 1000 + nanoseconds / 1000000;
  
  // Enregistrement en base de manière asynchrone
  Metric.create({ strategy, latency }).catch(() => {});
  
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
      try {
        const stats = await mongoose.connection.db?.command({ collStats: model.collection.name });
        totalIndexSize = stats?.totalIndexSize || 0;
      } catch (e) {
        totalIndexSize = 0;
      }
      
      const count = await model.countDocuments();
      
      let status: "critical" | "warning" | "healthy" = "healthy";
      if (key === "no_index") status = "critical";
      else if (key === "single_index" && totalIndexSize > 1024 * 1024 * 500) status = "warning";

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
    const count = await UserCompoundIndex.countDocuments();
    if (count === 0) {
      return res.json([
        { collection: "Aucun", min: 0, avg: 0, p95: 0, p99: 0, max: 0 },
        { collection: "Simple", min: 0, avg: 0, p95: 0, p99: 0, max: 0 },
        { collection: "Composé", min: 0, avg: 0, p95: 0, p99: 0, max: 0 },
      ]);
    }

    const randomUser = await UserCompoundIndex.findOne().skip(Math.floor(Math.random() * Math.min(count, 1000)));
    const email = randomUser?.email || "test_1@example.com";

    const models = [
      { model: UserNoIndex, key: "no_index", label: "Aucun" },
      { model: UserSingleIndex, key: "single_index", label: "Simple" },
      { model: UserCompoundIndex, key: "compound_index", label: "Composé" },
    ];

    const results = await Promise.all(models.map(async ({ model, key, label }) => {
      const times: number[] = [];
      for(let i=0; i<3; i++) {
        const time = await measureAndSaveTime(model, key, () => model.findOne({ email }).lean());
        times.push(time);
      }

      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      return {
        collection: label,
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

    const query: any = {};
    if (filters.email) query.email = filters.email;
    if (filters.status) query.status = filters.status;
    if (filters.createdAt) query.createdAt = { $gte: new Date(filters.createdAt as string) };

    const start = Date.now();
    const explain = await model.find(query).explain("executionStats");
    const latency = Date.now() - start;
    
    Metric.create({ strategy: strategy as string, latency }).catch(() => {});

    // @ts-ignore
    const stats = explain.executionStats || explain[0]?.executionStats;

    if (!stats) {
       return res.status(404).json({ error: "Stats explain non disponibles" });
    }

    // --- ANALYSE EXPERTE ---
    const docsExamined = stats.totalDocsExamined;
    const nReturned = stats.nReturned;
    const ratio = nReturned > 0 ? (nReturned / (docsExamined || 1)) : 0;
    
    let verdict = "";
    let score = 0;
    let alerts = [];

    if (stats.executionStages?.stage === "COLLSCAN" || JSON.stringify(stats).includes("COLLSCAN")) {
      verdict = "Désastreux : La base de données doit lire chaque document un par un.";
      score = 10;
      alerts.push("COLLSCAN détecté : aucune indexation utilisée.");
    } else if (ratio < 0.1 && nReturned > 0) {
      verdict = "Inefficace : MongoDB examine trop de documents pour le résultat obtenu.";
      score = 40;
      alerts.push("Index peu sélectif : vérifiez l'ordre des champs.");
    } else if (nReturned === 0 && docsExamined > 0) {
      verdict = "Inutile : MongoDB a scanné des données pour ne rien trouver.";
      score = 20;
    } else {
      verdict = "Optimal : La requête utilise l'index de manière chirurgicale.";
      score = 100;
    }

    if (JSON.stringify(stats).includes("SORT_KEY")) {
      alerts.push("Tri en mémoire détecté : cela peut saturer la RAM.");
    }

    res.json({
      stage: stats.executionStages?.stage || "IXSCAN",
      totalDocsExamined: docsExamined,
      totalKeysExamined: stats.totalKeysExamined,
      executionTimeMillis: stats.executionTimeMillis,
      nReturned: nReturned,
      analysis: {
        verdict,
        score,
        ratio: ratio.toFixed(4),
        alerts
      },
      raw: explain // On renvoie tout le plan pour le front
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
    const { start, duration } = req.query;
    let startTime: Date;
    let windowSeconds: number;

    if (start) {
      startTime = new Date(parseInt(start as string));
      windowSeconds = parseInt(duration as string) || 60;
    } else {
      windowSeconds = 3600;
      startTime = new Date(Date.now() - windowSeconds * 1000);
    }

    const stats = await Metric.aggregate([
      { $match: { createdAt: { $gte: startTime } } },
      {
        $group: {
          _id: {
            timestamp: {
              $subtract: [
                { $toLong: "$createdAt" },
                { $mod: [{ $toLong: "$createdAt" }, 1000] }
              ]
            },
            strategy: "$strategy"
          },
          avgLatency: { $avg: "$latency" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.timestamp": 1 } }
    ]);

    const data = [];
    const step = Math.max(1, Math.floor(windowSeconds / 60));
    const startTs = startTime.getTime();
    
    for (let i = 0; i < windowSeconds; i += step) {
      const currentTs = startTs + i * 1000;
      const timeLabel = start ? `${i}s` : `-${Math.round((Date.now() - currentTs)/1000)}s`;

      const findStat = (strat: string, time: number) => 
        stats.find(s => s._id.timestamp >= time && s._id.timestamp < time + (step * 1000) && s._id.strategy === strat);

      const sNo = findStat("no_index", currentTs);
      const sSingle = findStat("single_index", currentTs);
      const sCompound = findStat("compound_index", currentTs);

      data.push({
        t: timeLabel,
        no_index: sNo?.avgLatency || 0,
        no_index_rps: sNo?.count || 0,
        single_index: sSingle?.avgLatency || 0,
        single_index_rps: sSingle?.count || 0,
        compound_index: sCompound?.avgLatency || 0,
        compound_index_rps: sCompound?.count || 0,
      });
    }

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getThroughput = async (req: Request, res: Response) => {
  try {
    const windowSeconds = 10;
    const startTime = new Date(Date.now() - windowSeconds * 1000);

    const [stats, total] = await Promise.all([
      Metric.aggregate([
        { $match: { createdAt: { $gte: startTime } } },
        { $group: { _id: "$strategy", count: { $sum: 1 } } }
      ]),
      Metric.countDocuments()
    ]);

    res.json({
      windowSeconds,
      total,
      no_index: (stats.find(s => s._id === "no_index")?.count || 0) / windowSeconds,
      single_index: (stats.find(s => s._id === "single_index")?.count || 0) / windowSeconds,
      compound_index: (stats.find(s => s._id === "compound_index")?.count || 0) / windowSeconds,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const runBenchmark = async (req: Request, res: Response) => {
  try {
    const { duration = "60s", vus = "20" } = req.query;
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    res.write("data: [INFO] Préparation du conteneur k6...\n\n");

    const args = [
      "run", 
      "--rm", 
      "--volumes-from", "api_optimisation",
      "--network", "optimisation_default", 
      "-e", `API_URL=http://api_optimisation:3001/api`, 
      "-e", `DURATION=${duration}`,
      "-e", `VUS=${vus}`,
      "grafana/k6", 
      "run", "/project/load-tests/benchmark.js"
    ];

    const child = spawn("docker", args);

    child.on("spawn", () => {
      res.write("data: [INFO] Processus Docker démarré...\n\n");
    });

    child.stdout.on("data", (data) => {
      const lines = data.toString().split("\n");
      lines.forEach(line => {
        if (line.trim()) res.write(`data: ${line}\n\n`);
      });
    });

    child.stderr.on("data", (data) => {
      const lines = data.toString().split("\n");
      lines.forEach(line => {
        if (line.trim()) res.write(`data: [stderr] ${line}\n\n`);
      });
    });

    child.on("close", (code) => {
      res.write(`data: [DONE] Test terminé (${code})\n\n`);
      res.end();
    });

    req.on("close", () => child.kill());
  } catch (error: any) {
    res.write(`data: [error] ${error.message}\n\n`);
    res.end();
  }
};

export const getComparison = async (req: Request, res: Response) => {
  try {
    const models = [
      { model: UserNoIndex, key: "no_index" },
      { model: UserSingleIndex, key: "single_index" },
      { model: UserCompoundIndex, key: "compound_index" },
    ];

    const writeResults = await Promise.all(models.map(async ({ model, key }) => {
      const times = [];
      for(let i=0; i<5; i++) {
        const start = process.hrtime();
        await model.create({ email: `write_test_${Date.now()}@test.com`, status: "pending" });
        const [s, ns] = process.hrtime(start);
        times.push(s * 1000 + ns / 1000000);
      }
      await model.deleteMany({ email: /write_test_/ });
      return { key, avg: times.reduce((a, b) => a + b, 0) / times.length };
    }));

    const radar = [
      { axis: "Lecture", no_index: 5, single_index: 85, compound_index: 98 },
      { axis: "Écriture", no_index: 100, single_index: 80, compound_index: 60 },
      { axis: "Throughput", no_index: 10, single_index: 75, compound_index: 95 },
      { axis: "Stabilité p99", no_index: 2, single_index: 80, compound_index: 92 },
      { axis: "Stockage", no_index: 100, single_index: 70, compound_index: 45 },
    ];

    res.json({
      radar,
      writePerf: [
        { 
          op: "Bulk Insert (1 doc)", 
          no_index: parseFloat(writeResults[0].avg.toFixed(2)),
          single_index: parseFloat(writeResults[1].avg.toFixed(2)),
          compound_index: parseFloat(writeResults[2].avg.toFixed(2))
        }
      ]
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// CRUD
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
    const _id = new mongoose.Types.ObjectId();
    const newUser = { ...req.body, _id };
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
    const [user] = await Promise.all([
      UserNoIndex.findByIdAndDelete(id),
      UserSingleIndex.findByIdAndDelete(id),
      UserCompoundIndex.findByIdAndDelete(id),
    ]);
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });
    res.json({ message: "Utilisateur supprimé" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
