# Documentation : Vue d'ensemble (Dashboard)

La page **Vue d'ensemble** est le centre de contrôle de l'application. Elle est conçue pour fournir une preuve visuelle immédiate de l'impact des stratégies d'indexation sur les performances de MongoDB.

## 1. Flux de Données (Data Flow)

Dès l'affichage de la page, le cycle suivant s'active :

1.  **Frontend** : Déclenche deux requêtes asynchrones via [TanStack Query](https://tanstack.com/query) :
    - `useCollections` : Récupère l'état physique des collections (documents, taille des index).
    - `useResponseTime` : Demande un test de performance de recherche en temps réel.
2.  **Backend (API Express)** :
    - Exécute des commandes système MongoDB (`collStats`) pour les statistiques de stockage.
    - Sélectionne un email aléatoire et chronomètre l'exécution d'une recherche sur les 3 collections.
3.  **Frontend** : Réceptionne les données JSON et met à jour les graphiques [Recharts](https://recharts.org) sans rechargement de page.

## 2. Composants de la page

### A. Cartes de Métriques
- **Latence p95** : Temps de réponse pour 95% des requêtes sur la collection la plus optimisée.
- **Documents totaux** : Volume de données réel extrait de MongoDB (ex: 5 000 000 de documents).
- **Indicateurs de Delta** : Comparaison visuelle montrant le gain de performance (en %) par rapport à une base non indexée.

### B. Graphiques de Performance
- **Temps de réponse (LinChart)** : Visualisation de la stabilité de la latence sur une fenêtre temporelle. Permet d'identifier les pics de latence subis par les collections sans index.
- **Distribution de latence (BarChart)** : Comparaison directe des 3 stratégies (Aucun vs Simple vs Composé) pour les métriques Moyenne, p95 et p99.

### C. Tableau des Collections
Vue tabulaire brute des métriques système :
- Nom réel de la collection.
- Définition de l'index appliqué.
- **Taille de l'index** : Montre le coût en stockage mémoire de chaque optimisation.

## 3. Interactions en temps réel

- **Benchmark Manuel** : Le bouton "Lancer un benchmark" force un rafraîchissement immédiat (`refetch`) des données, déclenchant de nouveaux tests côté serveur.
- **Rafraîchissement Automatique** : La page se met à jour périodiquement (toutes les 10-30s) pour surveiller l'impact d'un test de charge externe (ex: lancé via **k6**).

---
*Cette documentation est générée automatiquement pour servir de référence technique au projet.*
