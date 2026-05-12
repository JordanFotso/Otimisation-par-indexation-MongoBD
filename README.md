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
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TanStack](https://img.shields.io/badge/tanstack-%23FF4154.svg?style=for-the-badge&logo=react-query&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)

- [TanStack Start](https://tanstack.com/start) : Framework Fullstack (React 19).
- [Tailwind CSS v4](https://tailwindcss.com) : Styling utilitaire.
- [Recharts](https://recharts.org) : Visualisation de données.

### Backend (API REST)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)

- [Express](https://expressjs.com) : Framework serveur Node.js.
- [Mongoose](https://mongoosejs.com) : Modélisation d'objets MongoDB.
- [Bun](https://bun.sh) : Runtime haute performance.
- [Helmet](https://helmetjs.github.io/) & [CORS](https://github.com/expressjs/cors) : Sécurité et partage de ressources.

### Infrastructure
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)

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

#### Installation de Bun
Si vous n'avez pas encore Bun, vous pouvez l'installer avec les commandes suivantes :

**Linux & macOS :**
```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc  # Ou source ~/.zshrc selon votre shell
```

**Windows (via PowerShell) :**
```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

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

## Docker & Benchmarking

La méthode la plus simple pour lancer l'environnement complet et exécuter des tests de charge.

### 1. Démarrer l'infrastructure
Lancez MongoDB et l'API Express en arrière-plan :

```bash
docker compose up -d
```

### 2. Exécuter un test de charge (k6)
Une fois l'infrastructure prête, lancez le benchmark :

```bash
docker compose run --rm k6 run /scripts/benchmark.js
```

### 3. Utilitaires
- **Logs** : `docker compose logs -f api`
- **Arrêt** : `docker compose down`

## Déploiement

Le frontend est optimisé pour [Cloudflare Pages](https://pages.cloudflare.com/). Le serveur API peut être déployé sur toute plateforme supportant les conteneurs Docker ou un environnement Node.js/Bun.
