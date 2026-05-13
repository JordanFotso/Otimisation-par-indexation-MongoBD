import mongoose from "mongoose";
import { UserNoIndex, UserSingleIndex, UserCompoundIndex } from "../models/user.model";
import { connectDB } from "../config/database";

const COUNT = parseInt(process.env.SEED_COUNT || "100000");
const CHUNK_SIZE = 5000;

const statuses = ["active", "inactive", "pending"] as const;

function generateUser(id: number) {
  return {
    email: `test_${id}@example.com`,
    status: ["active", "inactive", "pending"][id % 3],
    createdAt: new Date(Date.now() - (id * 1000 * 60 * 60)), // Dates différentes pour le tri
    metadata: {
      loginCount: id % 100,
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
