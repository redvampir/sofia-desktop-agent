const fs = require('fs');
const config = require('./config');
const memory = require('./memory');

if (config.memoryPath) {
  try {
    if (!fs.existsSync(config.memoryPath)) {
      fs.mkdirSync(config.memoryPath, { recursive: true });
    }
    memory.setMemoryPath(config.memoryPath);
  } catch (err) {
    console.error('Failed to init memory path:', err.message);
  }
}

require('./src/api');
