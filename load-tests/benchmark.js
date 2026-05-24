import http from 'k6/http';
import { check, sleep } from 'k6';

// On utilise les variables d'environnement ou des valeurs par défaut
const DURATION = __ENV.DURATION || '60s';
const TARGET_VUS = __ENV.VUS || '20';

export const options = {
  stages: [
    { duration: '5s', target: parseInt(TARGET_VUS) }, // Montée rapide
    { duration: DURATION, target: parseInt(TARGET_VUS) }, // Durée demandée
    { duration: '5s', target: 0 },  // Descente
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
  },
};

export default function () {
  const BASE_URL = __ENV.API_URL || 'http://api_optimisation:3001/api';
  const email = `test_${Math.floor(Math.random() * 100000)}@example.com`;

  // On utilise le nouvel endpoint /test qui fait une vraie recherche DB
  http.get(`${BASE_URL}/test?strategy=no_index&email=${email}`);
  http.get(`${BASE_URL}/test?strategy=single_index&email=${email}`);
  http.get(`${BASE_URL}/test?strategy=compound_index&email=${email}`);

  sleep(1);
}
