# Plan de Dynamisation : MongoDB Index Optimizer

Ce document détaille les étapes nécessaires pour transformer les données simulées (mock) en un système dynamique réel connecté à MongoDB.

## Phase 1 : Infrastructure API (Backend)
- [x] Créer l'architecture de base du serveur API REST Express.
- [x] Implémenter les modèles Mongoose (`User`) avec 3 stratégies d'indexation distinctes.
- [x] Créer un script de "Seeding" (`bun run seed`) pour générer des données massives.
- [x] Créer les endpoints REST réels (`/collections`, `/metrics`, `/explain`).

## Phase 2 : Connexion Frontend
- [x] Installer `axios` et configurer un client API de base (`src/lib/api.ts`).
- [x] Vérifier la configuration de `TanStack Query` dans `__root.tsx`.
- [x] Créer des hooks personnalisés pour chaque endpoint (`useCollections`, `useMetrics`, `useExplain`, `useScenarios`).
- [x] Remplacer les imports de `mock-data.ts` par les données issues des hooks dans les composants (Overview, Collections, Scenarios, Explain).

## Phase 3 : Logique de Benchmark Réel
- [x] Créer un dossier `load-tests/` avec des scripts k6 (`.js`) pour chaque scénario.
- [x] Configurer k6 dans Docker Compose avec un profil `test` dédié.
- [x] Connecter le bouton "Lancer un benchmark" du frontend pour déclencher un conteneur k6 via l'API.
- [x] Implémenter le calcul du "Throughput" (requêtes par seconde) basé sur les données réelles de k6 (agrégation MongoDB).

## Phase 4 : Temps Réel (Optimisation)
- [x] Remplacer le polling par des **Server-Sent Events (SSE)** pour les logs de la console.
- [x] Ajouter un système de logs en direct dans la console sidebar.

## Phase 5 : Validation & Docker
- [x] Créer le fichier `docker-compose.yml` initial (API + MongoDB).
- [x] Ajouter des **Healthchecks** dans Docker Compose pour garantir l'ordre de démarrage.
- [x] Mettre en place la gestion des variables d'environnement (** fichiers .env**).
- [ ] Vérifier que le `docker-compose.yml` expose correctement MongoDB pour les scripts de benchmark.
