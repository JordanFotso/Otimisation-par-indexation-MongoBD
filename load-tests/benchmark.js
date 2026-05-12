import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 20 }, // Montée en charge
    { duration: '20s', target: 20 }, // Plateau
    { duration: '5s', target: 0 },  // Descente
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95% des requêtes doivent être sous 200ms
  },
};

export default function () {
  const BASE_URL = __ENV.API_URL || 'http://api:3001/api';
  const email = `user_${Math.floor(Math.random() * 5000000)}@example.com`;

  // Test simultané des trois stratégies
  const responses = http.batch([
    ['GET', `${BASE_URL}/status?strategy=no_index&email=${email}`],
    ['GET', `${BASE_URL}/status?strategy=single_index&email=${email}`],
    ['GET', `${BASE_URL}/status?strategy=compound_index&email=${email}`],
  ]);

  check(responses[0], { 'status 200 (no_index)': (r) => r.status === 200 });
  check(responses[1], { 'status 200 (single_index)': (r) => r.status === 200 });
  check(responses[2], { 'status 200 (compound_index)': (r) => r.status === 200 });

  sleep(1);
}
