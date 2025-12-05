#!/usr/bin/env node
const https = require('https');

const urls = [
  'https://images.unsplash.com/photo-1508921912186-1d1a45ebb3c1?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80',
];

(async () => {
  for (const url of urls) {
    await new Promise((resolve) => {
      try {
        const req = https.request(url, { method: 'HEAD' }, (res) => {
          console.log(url, '->', res.statusCode, res.headers['content-type']);
          resolve();
        });
        req.on('error', (err) => {
          console.error('Failed:', url, err.message);
          resolve();
        });
        req.end();
      } catch (e) {
        console.error('Failed:', url, e.message);
        resolve();
      }
    });
  }
})();
