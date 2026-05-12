import { connectDB } from "./config/database";
import mongoose from "mongoose";

async function testConnection() {
  console.log("[test]: Tentative de connexion à MongoDB...");
  await connectDB();
  
  const state = mongoose.connection.readyState;
  const states = {
    0: "Déconnecté",
    1: "Connecté",
    2: "En cours de connexion",
    3: "En cours de déconnexion",
  };
  
  console.log(`[test]: État de la connexion : ${states[state as keyof typeof states]}`);
  
  if (state === 1) {
    console.log("[test]: Succès ! La connexion est opérationnelle.");
    
    // Vérifier les collections
    const collections = await mongoose.connection.db?.listCollections().toArray();
    console.log("[test]: Collections trouvées :", collections?.map(c => c.name).join(", ") || "Aucune");
  }
  
  process.exit(0);
}

testConnection().catch(err => {
  console.error("[test]: Échec de la connexion :", err.message);
  process.exit(1);
});
