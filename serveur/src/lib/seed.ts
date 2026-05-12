import mongoose from "mongoose";
import { UserNoIndex, UserSingleIndex, UserCompoundIndex } from "../models/user.model";
import { connectDB } from "../config/database";

const COUNT = parseInt(process.env.SEED_COUNT || "100000");
const CHUNK_SIZE = 5000;

const statuses = ["active", "inactive", "pending"] as const;

function generateUser(id: number) {
  return {
    email: `user_${id}_${Math.random().toString(36).substring(7)}@example.com`,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)),
    metadata: {
      loginCount: Math.floor(Math.random() * 100),
      lastIp: `192.168.1.${Math.floor(Math.random() * 255)}`,
      tags: ["benchmark", "test", "mongodb"].slice(0, Math.floor(Math.random() * 3) + 1)
    }
  };
}

async function seed() {
  await connectDB();

  console.log(`[seed]: Starting seeding of ${COUNT} documents per collection...`);

  const models = [UserNoIndex, UserSingleIndex, UserCompoundIndex];

  for (const model of models) {
    console.log(`[seed]: Cleaning collection ${model.collection.name}...`);
    await model.deleteMany({});
    
    let processed = 0;
    while (processed < COUNT) {
      const currentChunkSize = Math.min(CHUNK_SIZE, COUNT - processed);
      const users = Array.from({ length: currentChunkSize }, (_, i) => generateUser(processed + i));
      
      await model.insertMany(users, { ordered: false });
      processed += currentChunkSize;
      
      const progress = ((processed / COUNT) * 100).toFixed(1);
      console.log(`[seed]: ${model.collection.name} -> ${processed}/${COUNT} (${progress}%)`);
    }
    
    console.log(`[seed]: Building indexes for ${model.collection.name}...`);
    await model.createIndexes();
  }

  console.log("[seed]: Seeding completed successfully!");
  process.exit(0);
}

seed().catch(err => {
  console.error("[seed]: Fatal error during seeding:", err);
  process.exit(1);
});
