# Plan de Dynamisation : MongoDB Index Optimizer

Ce document détaille les étapes nécessaires pour transformer les données simulées (mock) en un système dynamique réel connecté à MongoDB.

## Phase 1 : Infrastructure API (Backend)
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
- [ ] Remplacer les imports de `mock-data.ts` par les données issues des hooks dans les composants :
    - `index.tsx` (Tableau de bord principal)
    - `collections.tsx`
    - `load-testing.tsx`

## Phase 3 : Logique de Benchmark Réel
- [ ] Créer un dossier `load-tests/` avec des scripts k6 (`.js`) pour chaque scénario.
- [ ] Configurer k6 dans Docker Compose avec un profil `test` dédié.
- [ ] Connecter le bouton "Lancer un benchmark" du frontend pour déclencher un conteneur k6 via l'API (utilisation de l'API Docker ou commandes CLI).
- [ ] Implémenter le parsing des résultats JSON de k6 côté serveur pour les renvoyer au frontend.
- [ ] Implémenter le calcul du "Throughput" (requêtes par seconde) basé sur les données réelles de k6.

## Phase 4 : Temps Réel (Optimisation)
- [ ] Remplacer le polling par des **Server-Sent Events (SSE)** ou des **WebSockets** pour les graphiques en temps réel pendant les tests de charge.
- [ ] Ajouter un système de logs en direct dans la console sidebar pour voir les requêtes MongoDB en cours d'exécution.

## Phase 5 : Validation & Docker
- [ ] Vérifier que le `docker-compose.yml` expose correctement MongoDB pour les scripts de benchmark.
- [ ] Créer un fichier `.env` pour centraliser les configurations (URI MongoDB, ports, etc.).
