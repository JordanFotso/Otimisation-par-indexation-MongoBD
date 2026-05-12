# Plan de Dynamisation : MongoDB Index Optimizer

Ce document détaille les étapes nécessaires pour transformer les données simulées (mock) en un système dynamique réel connecté à MongoDB.

## Phase 1 : Infrastructure API (Backend)
- [x] Créer l'architecture de base du serveur API REST Express.
- [ ] Créer un script de "Seeding" pour injecter 5 millions de documents dans MongoDB via Docker.
- [ ] Implémenter les modèles Mongoose pour les collections de test.
- [ ] Créer les endpoints REST réels :
    - `GET /api/collections` : Retourne l'état réel des index et le nombre de documents.
    - `GET /api/metrics/response-time` : Calcule la latence réelle sur les 3 types d'index.
    - `POST /api/benchmark/run` : Déclenche une série de requêtes pour mesurer les performances.
    - `GET /api/explain` : Exécute une commande `.explain()` réelle sur MongoDB et retourne le JSON.

## Phase 2 : Connexion Frontend
- [ ] Installer `axios` et configurer un client API de base.
- [ ] Configurer `TanStack Query` (React Query) dans `__root.tsx` pour gérer le cache et les états de chargement.
- [ ] Créer des hooks personnalisés (ex: `useCollections`, `useMetrics`) dans `src/hooks/`.
- [ ] Remplacer les imports de `mock-data.ts` par les données issues des hooks dans les composants.

## Phase 3 : Logique de Benchmark Réel
- [x] Créer un dossier `load-tests/` avec des scripts k6 (`.js`) pour chaque scénario.
- [x] Configurer k6 dans Docker Compose avec un profil `test` dédié.
- [ ] Connecter le bouton "Lancer un benchmark" du frontend pour déclencher un conteneur k6 via l'API.
- [ ] Implémenter le parsing des résultats JSON de k6 côté serveur.
- [ ] Implémenter le calcul du "Throughput" (requêtes par seconde) basé sur les données réelles de k6.

## Phase 4 : Temps Réel (Optimisation)
- [ ] Remplacer le polling par des **Server-Sent Events (SSE)** ou des **WebSockets**.
- [ ] Ajouter un système de logs en direct dans la console sidebar.

## Phase 5 : Validation & Docker
- [x] Créer le fichier `docker-compose.yml` initial (API + MongoDB).
- [x] Ajouter des **Healthchecks** dans Docker Compose pour garantir l'ordre de démarrage.
- [x] Mettre en place la gestion des variables d'environnement (** fichiers .env**).
- [ ] Vérifier que le `docker-compose.yml` expose correctement MongoDB pour les scripts de benchmark.
