const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, 'config.local.json');

const config = { memoryPath: '', memoryMode: 'local', localPath: '' };

function load() {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      const json = JSON.parse(data);
      if (json && typeof json.localPath === 'string') {
        config.localPath = json.localPath;
      }
      if (json && typeof json.memoryPath === 'string') {
        config.memoryPath = json.memoryPath;
      }
      if (json && typeof json.memoryMode === 'string') {
        config.memoryMode = json.memoryMode;
      }
    } catch (err) {
      console.error('Failed to read config:', err.message);
    }
  } else if (process.env.LOCAL_MEMORY_PATH) {
    config.localPath = process.env.LOCAL_MEMORY_PATH;
    config.memoryPath = process.env.LOCAL_MEMORY_PATH;
    if (process.env.MEMORY_MODE) {
      config.memoryMode = process.env.MEMORY_MODE;
    }
  }

  if (!config.localPath && config.memoryPath) {
    config.localPath = config.memoryPath;
  }
  if (config.memoryMode === 'local' && !config.memoryPath) {
    config.memoryPath = config.localPath;
  }
}

function save() {
  try {
    fs.writeFileSync(
      CONFIG_FILE,
      JSON.stringify({
        memoryPath: config.memoryPath,
        memoryMode: config.memoryMode,
        localPath: config.localPath
      }, null, 2)
    );
  } catch (err) {
    console.error('Failed to write config:', err.message);
  }
}

function setMemoryPath(p) {
  config.memoryPath = p;
  save();
}

function setLocalPath(p) {
  config.localPath = p;
  config.memoryPath = p;
  save();
}

function setMemoryMode(m) {
  config.memoryMode = m;
  save();
}

load();

module.exports = {
  get memoryPath() {
    return config.memoryPath;
  },
  get memoryMode() {
    return config.memoryMode;
  },
  get localPath() {
    return config.localPath;
  },
  setMemoryPath,
  setLocalPath,
  setMemoryMode
};
