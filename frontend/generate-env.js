const fs = require('fs');
const path = require('path');

const env = {
    API_URL: process.env.API_URL || 'https://reinigung-two.vercel.app'
};

const content = `window.ENV = window.ENV || ${JSON.stringify(env, null, 4)};\n`;
const outPath = path.resolve(process.cwd(), 'js', 'env.js');

console.log('🔧 Generating frontend/env.js with API_URL:', env.API_URL);
fs.writeFileSync(outPath, content, 'utf8');
console.log('✅ Generated', outPath);
