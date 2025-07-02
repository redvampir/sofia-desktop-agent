const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, 'config.local.json');

const config = { memoryPath: '' };

function load() {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      const json = JSON.parse(data);
      if (json && typeof json.memoryPath === 'string') {
        config.memoryPath = json.memoryPath;
      }
    } catch (err) {
      console.error('Failed to read config:', err.message);
    }
  } else if (process.env.LOCAL_MEMORY_PATH) {
    config.memoryPath = process.env.LOCAL_MEMORY_PATH;
  }
}

function save() {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ memoryPath: config.memoryPath }, null, 2));
  } catch (err) {
    console.error('Failed to write config:', err.message);
  }
}

function setMemoryPath(p) {
  config.memoryPath = p;
  save();
}

load();

module.exports = {
  get memoryPath() {
    return config.memoryPath;
  },
  setMemoryPath
};
