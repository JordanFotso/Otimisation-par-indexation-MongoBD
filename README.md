# Console d'Optimisation par Indexation MongoDB

Ce projet est une solution fullstack conçue pour le benchmark et l'analyse en temps réel des stratégies d'indexation MongoDB. Elle permet de visualiser l'impact des différents types d'index (COLLSCAN vs IXSCAN) sur la latence, le débit (throughput) et l'utilisation des ressources système.

## Table des matières

- [Présentation](#présentation)
- [Technologies utilisées](#technologies-utilisées)
- [Architecture du projet](#architecture-du-projet)
- [Fonctionnalités](#fonctionnalités)
- [Installation et Utilisation](#installation-et-utilisation)
- [Docker Compose](#docker-compose)
- [Déploiement](#déploiement)

## Présentation

L'application simule une charge de travail sur une base de données MongoDB contenant 5 millions de documents. Elle offre une interface interactive pour comparer trois stratégies d'indexation distinctes, permettant d'identifier la configuration optimale pour des recherches intensives.

## Technologies utilisées

### Frontend
- [TanStack Start](https://tanstack.com/start) : Framework Fullstack (React 19).
- [Tailwind CSS v4](https://tailwindcss.com) : Styling utilitaire.
- [Recharts](https://recharts.org) : Visualisation de données.

### Backend (API REST)
- [Express](https://expressjs.com) : Framework serveur Node.js.
- [Mongoose](https://mongoosejs.com) : Modélisation d'objets MongoDB.
- [Bun](https://bun.sh) : Runtime haute performance.
- [Helmet](https://helmetjs.github.io/) & [CORS](https://github.com/expressjs/cors) : Sécurité et partage de ressources.

### Infrastructure
- [MongoDB](https://www.mongodb.com) : Base de données NoSQL.
- [Docker](https://www.docker.com) : Conteneurisation et orchestration.

## Architecture du projet

Le projet est divisé en deux parties principales :

- `/src` : Application frontend (TanStack Start).
- `/serveur` : API REST Express.
    - `src/controllers` : Logique métier.
    - `src/routes` : Définition des points de terminaison.
    - `src/models` : Schémas de données Mongoose.
    - `src/config` : Configurations (Base de données, etc.).
- `docker-compose.yml` : Orchestration des services à la racine.

## Fonctionnalités

- **Benchmark en temps réel** : Analyse de la latence p95/p99.
- **Load Testing** : Simulation de trafic via k6 ou hey.
- **Intégration MongoDB** : Connexion réelle et analyse des plans d'exécution.
- **Conteneurisation complète** : Déploiement simplifié via Docker.

## Installation et Utilisation

### Prérequis
- [Bun](https://bun.sh) (recommandé) ou [Node.js](https://nodejs.org) (v22+).
- [Docker](https://www.docker.com) (optionnel, pour l'orchestration).

### Installation locale
Installez les dépendances pour le frontend et le serveur :

```bash
# Frontend
bun install

# Serveur
cd serveur
bun install
```

### Lancement en mode développement
Vous devez lancer les deux parties séparément si vous n'utilisez pas Docker :

```bash
# Terminal 1 (Racine - Frontend)
bun run dev

# Terminal 2 (Dossier serveur - API)
cd serveur
bun run dev
```

## Docker Compose

La méthode la plus simple pour lancer l'environnement complet (MongoDB + API) est d'utiliser Docker Compose :

```bash
docker compose up --build
```

Cette commande démarre :
- MongoDB sur le port `27017`.
- L'API Express sur le port `3001`.
- Un volume persistant `mongo_data` pour les données MongoDB.

## Déploiement

Le frontend est optimisé pour [Cloudflare Pages](https://pages.cloudflare.com/). Le serveur API peut être déployé sur toute plateforme supportant les conteneurs Docker ou un environnement Node.js/Bun.
