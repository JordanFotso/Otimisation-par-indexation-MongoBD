export type CollectionKey = "no_index" | "single_index" | "compound_index";

export interface CollectionInfo {
  key: CollectionKey;
  name: string;
  label: string;
  index: string;
  documents: number;
  indexSize: string;
  color: string;
  status: "critical" | "warning" | "healthy";
}

export const COLLECTIONS: CollectionInfo[] = [
  {
    key: "no_index",
    name: "users_no_index",
    label: "Aucun index",
    index: "—",
    documents: 5_000_000,
    indexSize: "0 MB",
    color: "var(--chart-4)",
    status: "critical",
  },
  {
    key: "single_index",
    name: "users_single_index",
    label: "Index simple",
    index: "{ email: 1 }",
    documents: 5_000_000,
    indexSize: "142 MB",
    color: "var(--chart-2)",
    status: "warning",
  },
  {
    key: "compound_index",
    name: "users_compound_index",
    label: "Index composé",
    index: "{ status: 1, createdAt: -1, email: 1 }",
    documents: 5_000_000,
    indexSize: "318 MB",
    color: "var(--chart-3)",
    status: "healthy",
  },
];

export const RESPONSE_TIME = [
  { collection: "Aucun", min: 412, avg: 1820, p95: 3210, p99: 4870, max: 6120 },
  { collection: "Simple", min: 4, avg: 18, p95: 42, p99: 88, max: 156 },
  { collection: "Composé", min: 1, avg: 6, p95: 14, p99: 28, max: 61 },
];

export const THROUGHPUT = [
  { rps: 50, no_index: 48, single_index: 50, compound_index: 50 },
  { rps: 100, no_index: 62, single_index: 99, compound_index: 100 },
  { rps: 250, no_index: 71, single_index: 244, compound_index: 250 },
  { rps: 500, no_index: 73, single_index: 421, compound_index: 498 },
  { rps: 1000, no_index: 70, single_index: 612, compound_index: 974 },
];

export const TIMESERIES = Array.from({ length: 30 }, (_, i) => ({
  t: i,
  no_index: 1500 + Math.round(Math.sin(i / 3) * 400 + Math.random() * 600),
  single_index: 18 + Math.round(Math.sin(i / 4) * 6 + Math.random() * 8),
  compound_index: 6 + Math.round(Math.sin(i / 5) * 3 + Math.random() * 3),
}));

export const EXPLAIN = {
  no_index: {
    stage: "COLLSCAN",
    totalDocsExamined: 5_000_000,
    totalKeysExamined: 0,
    executionTimeMillis: 1820,
    nReturned: 1,
  },
  single_index: {
    stage: "IXSCAN",
    totalDocsExamined: 1,
    totalKeysExamined: 1,
    executionTimeMillis: 12,
    nReturned: 1,
  },
  compound_index: {
    stage: "IXSCAN",
    totalDocsExamined: 1,
    totalKeysExamined: 1,
    executionTimeMillis: 4,
    nReturned: 1,
  },
};

export const SCENARIOS = [
  {
    id: "S1",
    name: "Recherche par email",
    method: "GET",
    path: "/api/users?email=:email",
    description: "Lookup unique sur un champ indexable haute cardinalité.",
    filters: ["email"],
  },
  {
    id: "S2",
    name: "Filtres multiples",
    method: "GET",
    path: "/api/users?status=active&from=2024-01-01",
    description: "Filtre composé status + plage de date de création.",
    filters: ["status", "createdAt"],
  },
  {
    id: "S3",
    name: "Tri + pagination",
    method: "GET",
    path: "/api/users?status=active&sort=-createdAt&page=42",
    description: "Requête complexe combinant filtre, tri descendant et pagination profonde.",
    filters: ["status", "createdAt", "email"],
  },
];

export const WRITE_PERF = [
  { op: "Insert 10k", no_index: 320, single_index: 480, compound_index: 612 },
  { op: "Update 10k", no_index: 410, single_index: 540, compound_index: 720 },
  { op: "Bulk 100k", no_index: 2800, single_index: 4100, compound_index: 5300 },
];

export const RESOURCES = [
  { metric: "CPU backend", no_index: 92, single_index: 41, compound_index: 28 },
  { metric: "RAM MongoDB", no_index: 78, single_index: 52, compound_index: 56 },
  { metric: "I/O disque", no_index: 88, single_index: 22, compound_index: 18 },
];
