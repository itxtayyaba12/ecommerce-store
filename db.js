const fs = require('fs');
const path = require('path');

const dataPath = (file) => path.join(__dirname, 'data', file);

function readData(file) {
  const raw = fs.readFileSync(dataPath(file), 'utf-8');
  return JSON.parse(raw || '[]');
}

function writeData(file, data) {
  fs.writeFileSync(dataPath(file), JSON.stringify(data, null, 2));
}

module.exports = { readData, writeData };