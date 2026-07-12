const fs = require('fs');
const path = require('path');

const env = {
    API_URL: process.env.API_URL || 'http://localhost:3000'
};

const content = `window.ENV = window.ENV || ${JSON.stringify(env, null, 4)};\n`;
const outPath = path.resolve(process.cwd(), 'frontend', 'js', 'env.js');

fs.writeFileSync(outPath, content, 'utf8');
console.log('✅ Generated', outPath);
