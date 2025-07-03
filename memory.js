// memory.js
// Модуль для работы с локальной памятью
const fs = require('fs');
const path = require('path');

/**
 * Объект состояния локальной памяти
 * base_path    - базовая директория, в которой хранятся папки проектов
 * folder       - текущая папка проекта
 * memory_path  - полный путь до активной памяти
 * last_plan    - кеш последнего плана
 * active_memory_file - имя загруженного файла памяти
 * @type {{base_path: string, folder: string, memory_path: string, last_plan: string, active_memory_file: string}}
 */
const memory_state = {
  base_path: '',
  folder: '',
  memory_path: '',
  last_plan: '',
  active_memory_file: ''
};

/**
 * Resolves a path relative to the memory root and ensures
 * that it stays within the memory directory.
 * Throws an error if the path is invalid or escapes the memory folder.
 *
 * @param {string} filename relative path inside memory
 * @returns {string} resolved absolute path
 */
function resolveMemoryPath(filename) {
  if (!memory_state.memory_path) {
    throw new Error('Память не настроена');
  }
  if (path.isAbsolute(filename) || filename.split(/[\\/]/).includes('..')) {
    throw new Error('Некорректный путь');
  }

  const full = path.resolve(memory_state.memory_path, filename);
  const rel = path.relative(memory_state.memory_path, full);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error('Некорректный путь');
  }
  return full;
}

/**
 * Проверяет доступность указанной папки и устанавливает её в качестве памяти
 * Аргументы:
 *     folder (string): путь до папки памяти
 */
function setLocalMemoryBasePath(folder) {
  const resolved = path.resolve(folder);
  fs.accessSync(resolved, fs.constants.R_OK | fs.constants.W_OK);
  memory_state.base_path = resolved;
  // обновляем полный путь если уже выбрана папка проекта
  if (memory_state.folder) {
    memory_state.memory_path = path.join(memory_state.base_path, memory_state.folder);
  }
}

/**
 * Устанавливает полный путь к памяти без использования подпапок
 * Аргументы:
 *     folder (string): путь до директории памяти
 */
function setMemoryPath(folder) {
  const resolved = path.resolve(folder);
  fs.accessSync(resolved, fs.constants.R_OK | fs.constants.W_OK);
  memory_state.base_path = resolved;
  memory_state.folder = '';
  memory_state.memory_path = resolved;
}

/**
 * Инициализирует структуру памяти и создаёт index.json
 * Возвращает:
 *     boolean — успешно ли выполнена операция
 */
function initializeMemory() {
  if (!memory_state.memory_path) {
    throw new Error('Память не настроена');
  }

  const memoryDir = path.join(memory_state.memory_path, 'memory');
  const versionsDir = path.join(memory_state.memory_path, 'versions');
  if (!fs.existsSync(memoryDir)) {
    fs.mkdirSync(memoryDir, { recursive: true });
  }
  if (!fs.existsSync(versionsDir)) {
    fs.mkdirSync(versionsDir, { recursive: true });
  }

  const indexPath = path.join(memory_state.memory_path, 'index.json');
  if (!fs.existsSync(indexPath)) {
    fs.writeFileSync(indexPath, '[]', 'utf8');
  }
  return true;
}

/**
 * Переключается на другую папку памяти после проверки доступности
 * Аргументы:
 *     folder (string): путь до новой папки
 */
function setMemoryFolder(name) {
  if (!memory_state.base_path) {
    throw new Error('Базовый путь не задан');
  }
  const resolved = path.join(memory_state.base_path, name);
  fs.accessSync(resolved, fs.constants.R_OK | fs.constants.W_OK);
  memory_state.folder = name;
  memory_state.memory_path = resolved;
}

/**
 * Возвращает текущий план или сообщение по умолчанию
 * Возвращает:
 *     string — путь файла плана или текст по умолчанию
 */
function getCurrentPlan() {
  if (!memory_state.memory_path) {
    return 'Память не настроена';
  }
  const planPath = path.join(memory_state.memory_path, 'plan.md');
  const indexPath = path.join(memory_state.memory_path, 'index.json');
  if (fs.existsSync(planPath)) {
    return fs.readFileSync(planPath, 'utf8');
  }
  if (fs.existsSync(indexPath)) {
    return fs.readFileSync(indexPath, 'utf8');
  }
  return 'План отсутствует';
}

/**
 * Сохраняет содержимое в файл выбранной памяти
 * Аргументы:
 *     filename (string): имя файла
 *     content (string): содержимое для записи
 * Возвращает:
 *     string — полный путь сохранённого файла
 */
function writeMemoryFile(filename, content) {
  const filePath = resolveMemoryPath(path.join('memory', filename));
  const dirPath = path.dirname(filePath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
}

/**
 * Читает содержимое файла из выбранной памяти
 * Аргументы:
 *     filename (string): имя файла
 * Возвращает:
 *     Promise<string> — содержимое файла
 */
async function readMemoryFile(filename) {
  const filePath = resolveMemoryPath(path.join('memory', filename));
  try {
    return await fs.promises.readFile(filePath, 'utf8');
  } catch (err) {
    throw new Error('Файл не найден');
  }
}

/**
 * Возвращает список файлов из папки памяти
 * Возвращает:
 *     Promise<string[]> — имена файлов памяти
 */
async function listMemoryFiles() {
  if (!memory_state.memory_path) {
    throw new Error('Память не настроена');
  }
  const dirPath = path.join(memory_state.memory_path, 'memory');
  const files = await fs.promises.readdir(dirPath, { withFileTypes: true });
  return files
    .filter((f) => f.isFile() && (f.name.endsWith('.md') || f.name.endsWith('.json')))
    .map((f) => f.name);
}

/**
 * Загружает указанный файл памяти и делает его активным
 * Аргументы:
 *     filename (string): имя файла
 * Возвращает:
 *     Promise<string> — содержимое файла
 */
async function loadMemoryFile(filename) {
  const content = await readMemoryFile(filename);
  memory_state.last_plan = content;
  memory_state.active_memory_file = filename;
  return content;
}

/**
 * Сохраняет файл и обновляет index.json
 * Аргументы:
 *     filename (string): относительный путь файла
 *     content (string): содержимое
 *     type (string): тип памяти
 */
async function saveMemoryWithIndex(filename, content, type = 'memory') {
  const full_path = resolveMemoryPath(filename);
  await fs.promises.mkdir(path.dirname(full_path), { recursive: true });
  await fs.promises.writeFile(full_path, content, 'utf8');

  const index_path = path.join(memory_state.memory_path, 'index.json');
  let index = [];
  if (fs.existsSync(index_path)) {
    try {
      const data = await fs.promises.readFile(index_path, 'utf8');
      index = JSON.parse(data);
    } catch (err) {
      console.error('Ошибка чтения index.json:', err.message);
    }
  }

  const entry = {
    path: filename,
    title: path.basename(filename, path.extname(filename)),
    type,
    description: '',
    lastModified: new Date().toISOString()
  };

  const existing = index.find((i) => i.path === filename);
  if (existing) {
    existing.title = entry.title;
    existing.type = entry.type;
    existing.description = entry.description;
    existing.lastModified = entry.lastModified;
  } else {
    index.push(entry);
  }

  await fs.promises.writeFile(index_path, JSON.stringify(index, null, 2));
  return true;
}

/**
 * Пересоздаёт index.json сканируя папку memory
 * Возвращает:
 *     boolean — результат операции
 */
async function updateIndex() {
  if (!memory_state.memory_path) {
    throw new Error('Память не настроена');
  }
  const dirPath = path.join(memory_state.memory_path, 'memory');
  const files = await fs.promises.readdir(dirPath, { withFileTypes: true });
  const index = [];
  for (const f of files) {
    if (f.isFile() && (f.name.endsWith('.md') || f.name.endsWith('.json'))) {
      const rel = path.join('memory', f.name);
      const stat = await fs.promises.stat(path.join(dirPath, f.name));
      index.push({
        path: rel,
        title: path.basename(f.name, path.extname(f.name)),
        type: 'memory',
        description: '',
        lastModified: stat.mtime.toISOString()
      });
    }
  }
  const index_path = path.join(memory_state.memory_path, 'index.json');
  await fs.promises.writeFile(index_path, JSON.stringify(index, null, 2));
  return true;
}

/**
 * Сохраняет текущие инструкции в новую версию
 * Возвращает путь созданной версии
 */
function commitInstructionVersion() {
  if (!memory_state.memory_path) {
    throw new Error('Память не настроена');
  }
  const instructionsPath = path.join(memory_state.memory_path, 'memory', 'instructions.md');
  if (!fs.existsSync(instructionsPath)) {
    throw new Error('Файл instructions.md не найден');
  }
  const versionsDir = path.join(memory_state.memory_path, 'versions');
  if (!fs.existsSync(versionsDir)) {
    fs.mkdirSync(versionsDir, { recursive: true });
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const versionFile = path.join(versionsDir, `instructions_${stamp}.md`);
  fs.copyFileSync(instructionsPath, versionFile);
  return versionFile;
}

/**
 * Откатывает файл instructions.md к последней версии
 * Возвращает путь восстановленного файла
 */
function rollbackInstructionVersion() {
  if (!memory_state.memory_path) {
    throw new Error('Память не настроена');
  }
  const versionsDir = path.join(memory_state.memory_path, 'versions');
  if (!fs.existsSync(versionsDir)) {
    throw new Error('Версии отсутствуют');
  }
  const files = fs.readdirSync(versionsDir)
    .filter((f) => f.startsWith('instructions_') && f.endsWith('.md'))
    .sort();
  if (!files.length) {
    throw new Error('Версии отсутствуют');
  }
  const latest = files[files.length - 1];
  const versionFile = path.join(versionsDir, latest);
  const instructionsPath = path.join(memory_state.memory_path, 'memory', 'instructions.md');
  fs.copyFileSync(versionFile, instructionsPath);
  return instructionsPath;
}

/**
 * Возвращает список доступных версий инструкций
 */
function listInstructionVersions() {
  if (!memory_state.memory_path) {
    throw new Error('Память не настроена');
  }
  const versionsDir = path.join(memory_state.memory_path, 'versions');
  if (!fs.existsSync(versionsDir)) {
    return [];
  }
  return fs.readdirSync(versionsDir)
    .filter((f) => f.startsWith('instructions_') && f.endsWith('.md'))
    .sort();
}

/**
 * Возвращает список файлов из index.json
 * Аргументы:
 *     dir (string): относительный путь папки
 * Возвращает:
 *     Promise<Object[]> — данные файлов
 */
async function listFiles(dir = '') {
  if (!memory_state.memory_path) {
    throw new Error('Память не настроена');
  }
  const index_path = path.join(memory_state.memory_path, 'index.json');
  let index = [];
  if (fs.existsSync(index_path)) {
    try {
      const data = await fs.promises.readFile(index_path, 'utf8');
      index = JSON.parse(data);
    } catch (err) {
      console.error('Ошибка чтения index.json:', err.message);
    }
  }

  if (dir) {
    return index.filter((e) => e.path.startsWith(dir));
  }
  return index;
}

module.exports = {
  memory_state,
  setLocalMemoryBasePath,
  setMemoryFolder,
  setMemoryPath,
  getCurrentPlan,
  writeMemoryFile,
  readMemoryFile,
  listMemoryFiles,
  loadMemoryFile,
  saveMemoryWithIndex,
  updateIndex,
  commitInstructionVersion,
  rollbackInstructionVersion,
  listInstructionVersions,
  listFiles,
  initializeMemory,
  resolveMemoryPath
};

// Этот модуль хранит и обновляет данные о локальной памяти.
// В дальнейшем функции можно расширить для работы с файловой системой.
