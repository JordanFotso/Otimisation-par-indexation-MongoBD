import app from "./app";
import { connectDB } from "./config/database";

const PORT = process.env.PORT || 3001;

// Connexion à la base de données
connectDB();

app.listen(PORT, () => {
  console.log(`[server]: Server is running at http://localhost:${PORT}`);
});
