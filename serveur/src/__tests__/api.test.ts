import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import request from "supertest";
import mongoose from "mongoose";
import app from "../app";
import { UserCompoundIndex } from "../models/user.model";

const TEST_MONGODB_URI = "mongodb://127.0.0.1:27017/optimisation_test";

describe("API Optimization Endpoints", () => {
  beforeAll(async () => {
    // Connexion à une base de test dédiée
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_MONGODB_URI);
    }
  });

  afterAll(async () => {
    // Nettoyage et déconnexion
    await mongoose.connection.db?.dropDatabase();
    await mongoose.connection.close();
  });

  describe("System Endpoints", () => {
    test("GET /api/status devrait retourner online", async () => {
      const res = await request(app).get("/api/status");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("online");
    });

    test("GET /api/collections devrait retourner les 3 collections", async () => {
      const res = await request(app).get("/api/collections");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(3);
    });
  });

  describe("CRUD Utilisateurs", () => {
    let createdUserId: string;

    test("POST /api/users devrait créer un utilisateur", async () => {
      const userData = {
        email: "test_unit@example.com",
        status: "active",
        metadata: { source: "test" }
      };

      const res = await request(app)
        .post("/api/users")
        .send(userData);

      expect(res.status).toBe(201);
      expect(res.body.email).toBe(userData.email);
      createdUserId = res.body._id;
    });

    test("GET /api/users devrait lister les utilisateurs", async () => {
      const res = await request(app).get("/api/users");
      expect(res.status).toBe(200);
      expect(res.body.users.length).toBeGreaterThan(0);
    });

    test("PATCH /api/users/:id devrait mettre à jour l'utilisateur", async () => {
      const res = await request(app)
        .patch(`/api/users/${createdUserId}`)
        .send({ status: "inactive" });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("inactive");
    });

    test("DELETE /api/users/:id devrait supprimer l'utilisateur", async () => {
      const res = await request(app).delete(`/api/users/${createdUserId}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toContain("supprimé");

      // Vérifier qu'il n'existe plus
      const check = await UserCompoundIndex.findById(createdUserId);
      expect(check).toBeNull();
    });
  });

  describe("Benchmark Endpoints", () => {
    test("GET /api/metrics/response-time devrait retourner des mesures", async () => {
      // On insère quelques données pour que le test puisse skip() et mesurer
      await UserCompoundIndex.create([
        { email: "b1@test.com", status: "active" },
        { email: "b2@test.com", status: "active" }
      ]);

      const res = await request(app).get("/api/metrics/response-time");
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(3);
      expect(res.body[0]).toHaveProperty("avg");
    });

    test("GET /api/explain devrait retourner un plan d'exécution", async () => {
      const res = await request(app)
        .get("/api/explain")
        .query({ strategy: "compound_index", email: "b1@test.com" });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("stage");
      expect(res.body.stage).toBeDefined();
    });
  });
});
