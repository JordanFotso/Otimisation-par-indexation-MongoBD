# Console d'Optimisation par Indexation MongoDB

Ce projet est une application web de haute performance conçue pour le benchmark et l'analyse en temps réel des stratégies d'indexation MongoDB. Elle permet de visualiser l'impact des différents types d'index (COLLSCAN vs IXSCAN) sur la latence, le débit (throughput) et l'utilisation des ressources système.

## Table des matières

- [Présentation](#présentation)
- [Technologies utilisées](#technologies-utilisées)
- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Installation](#installation)
- [Utilisation](#utilisation)
- [Déploiement](#déploiement)

## Présentation

L'application simule une charge de travail sur une base de données contenant 5 millions de documents. Elle offre une interface interactive pour comparer trois stratégies d'indexation distinctes, permettant aux ingénieurs DevOps et Database d'identifier la configuration optimale pour leurs cas d'usage spécifiques.

## Technologies utilisées

Le projet repose sur une stack moderne privilégiant la performance et le rendu côté serveur (SSR) :

- [TanStack Start](https://tanstack.com/start) : Framework Fullstack basé sur React 19.
- [TanStack Router](https://tanstack.com/router) : Gestion du routage typé et performant.
- [Tailwind CSS v4](https://tailwindcss.com) : Framework utilitaire pour le styling.
- [Recharts](https://recharts.org) : Visualisation de données pour les graphiques de performance.
- [Bun](https://bun.sh) : Runtime et gestionnaire de paquets haute performance.
- [Vite](https://vitejs.dev) : Outil de build et serveur de développement.

## Fonctionnalités

- **Benchmark en temps réel** : Analyse de la latence p95/p99 sous charge soutenue.
- **Load Testing** : Génération de trafic synthétique via les moteurs [k6](https://k6.io) et [hey](https://github.com/rakyll/hey).
- **Analyse Explain Plan** : Visualisation détaillée des étapes d'exécution des requêtes MongoDB.
- **Tableau de bord de métriques** : Suivi du nombre de documents scannés par requête et du coût en écriture induit par l'indexation.

## Architecture

Le projet suit une structure modulaire :

- `src/routes/` : Définition des pages et de la logique de routage.
- `src/components/` : Bibliothèque de composants UI basés sur Radix UI.
- `src/lib/` : Utilitaires et gestion des données de benchmark.
- `src/server.ts` : Point d'entrée du serveur pour le rendu SSR.

## Installation

Pour installer les dépendances du projet, assurez-vous d'avoir installé [Bun](https://bun.sh) sur votre système :

```bash
bun install
```

## Utilisation

### Développement

Pour lancer le serveur de développement avec rechargement à chaud :

```bash
bun run dev
```

### Build et Production

Pour générer la version de production optimisée :

```bash
bun run build
bun run start
```

## Déploiement

L'application est configurée pour être déployée sur [Cloudflare Pages](https://pages.cloudflare.com/) ou tout autre environnement supportant les Workers, grâce à l'intégration native de TanStack Start et du fichier `wrangler.jsonc`.
