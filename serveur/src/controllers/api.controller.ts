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
  console.log("[server]: Requête de comparaison reçue");
  try {
    const models = [
      { model: UserNoIndex, key: "no_index", label: "Aucun" },
      { model: UserSingleIndex, key: "single_index", label: "Simple" },
      { model: UserCompoundIndex, key: "compound_index", label: "Composé" },
    ];

    // 1. Coût en écriture
    const writeResults = await Promise.all(models.map(async ({ model, key }) => {
      const times = [];
      for(let i=0; i<5; i++) {
        const start = process.hrtime();
        await model.create({ email: `bench_write_${Date.now()}_${i}@test.com`, status: "pending" });
        const [s, ns] = process.hrtime(start);
        times.push(s * 1000 + ns / 1000000);
      }
      await model.deleteMany({ email: /bench_write_/ });
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      console.log(`  > Écriture ${key}: ${avg.toFixed(3)}ms`);
      return { key, avg };
    }));

    // 2. Lecture exhaustive
    const physicalStats = await Promise.all(models.map(async ({ model, key }) => {
      const stats = await mongoose.connection.db?.command({ collStats: model.collection.name });
      const count = await model.countDocuments();
      
      const scenarios = [
        () => model.findOne({ email: "test_1@example.com" }).lean(),
        () => model.find({ status: "active" }).limit(20).lean(),
        () => model.find({ status: "active" }).sort({ createdAt: -1 }).limit(20).lean(),
      ];

      const scenarioTimes = [];
      for (const runQuery of scenarios) {
        const iterations = [];
        for(let i=0; i<10; i++) {
          const start = process.hrtime();
          await runQuery();
          const [s, ns] = process.hrtime(start);
          iterations.push(s * 1000 + ns / 1000000);
        }
        scenarioTimes.push(iterations.reduce((a, b) => a + b, 0) / iterations.length);
      }

      const globalReadLat = scenarioTimes.reduce((a, b) => a + b, 0) / scenarioTimes.length;
      console.log(`--- Stats pour ${key} ---`);
      console.log(`  > Lecture (moy): ${globalReadLat.toFixed(3)}ms`);
      console.log(`  > Index Size: ${stats?.totalIndexSize} octets`);

      return {
        key,
        indexSize: stats?.totalIndexSize || 0,
        readLatency: globalReadLat,
        docCount: count
      };
    }));

    // 3. Stabilité
    const stabilityData = await Metric.aggregate([
      { $group: { _id: "$strategy", stdDev: { $stdDevPop: "$latency" } } }
    ]);
    const getStabilityScore = (strat: string) => {
      const stat = stabilityData.find(s => s._id === strat);
      const dev = stat?.stdDev || 50;
      const score = Math.max(10, Math.min(100, Math.round(100 * (1 - Math.min(dev, 50) / 50))));
      console.log(`  > Stabilité ${strat}: ${score} (dev: ${dev.toFixed(3)})`);
      return score;
    };

    // 4. Sélectivité
    const selectivityScores = await Promise.all(models.map(async ({ model, key }) => {
       const explain = await model.find({ status: "active" }).limit(1).explain("executionStats");
       const stats = explain.executionStats || explain[0]?.executionStats;
       const examined = stats?.totalDocsExamined || 1;
       const returned = stats?.nReturned || 1;
       const ratio = Math.max(0.01, returned / examined);
       const score = Math.round(10 + 90 * ratio);
       console.log(`  > Sélectivité ${key}: ${score} (examined: ${examined})`);
       return score;
    }));

    // Helpers pour les scores relatifs (Lecture, Ecriture, Stockage)
    const calculateRelativeScore = (values: number[], current: number, inverse = false) => {
      const min = Math.min(...values);
      const max = Math.max(...values);
      if (max === min) return 100;
      return inverse 
        ? Math.round(10 + 90 * (1 - (current - min) / (max - min)))
        : Math.round(10 + 90 * ((current - min) / (max - min)));
    };

    const readLats = physicalStats.map(s => s.readLatency);
    const writeLats = writeResults.map(w => w.avg);
    const storageSizes = physicalStats.map(s => s.indexSize);

    const radar = [
      {
        axis: "Lecture",
        no_index: calculateRelativeScore(readLats, physicalStats[0].readLatency, true),
        single_index: calculateRelativeScore(readLats, physicalStats[1].readLatency, true),
        compound_index: calculateRelativeScore(readLats, physicalStats[2].readLatency, true),
      },
      {
        axis: "Écriture",
        no_index: calculateRelativeScore(writeLats, writeResults[0].avg, true),
        single_index: calculateRelativeScore(writeLats, writeResults[1].avg, true),
        compound_index: calculateRelativeScore(writeLats, writeResults[2].avg, true),
      },
      {
        axis: "Stockage",
        no_index: calculateRelativeScore(storageSizes, physicalStats[0].indexSize, true),
        single_index: calculateRelativeScore(storageSizes, physicalStats[1].indexSize, true),
        compound_index: calculateRelativeScore(storageSizes, physicalStats[2].indexSize, true),
      },
      {
        axis: "Sélectivité",
        no_index: selectivityScores[0],
        single_index: selectivityScores[1],
        compound_index: selectivityScores[2],
      },
      {
        axis: "Stabilité",
        no_index: getStabilityScore("no_index"),
        single_index: getStabilityScore("single_index"),
        compound_index: getStabilityScore("compound_index"),
      }
    ];

    res.json({
      radar,
      writePerf: writeResults.map((w, i) => ({
        op: "Unitaire",
        no_index: i === 0 ? w.avg : 0,
        single_index: i === 1 ? w.avg : 0,
        compound_index: i === 2 ? w.avg : 0,
      })),
      physical: physicalStats.map((s, i) => ({
        ...s,
        label: models[i].label,
        indexSizeMB: (s.indexSize / 1024 / 1024).toFixed(2)
      }))
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
