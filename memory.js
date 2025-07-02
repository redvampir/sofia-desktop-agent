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
 * @type {{base_path: string, folder: string, memory_path: string, last_plan: string}}
 */
const memory_state = {
  base_path: '',
  folder: '',
  memory_path: '',
  last_plan: ''
};

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
  if (!memory_state.memory_path) {
    throw new Error('Память не настроена');
  }
  const dirPath = path.join(memory_state.memory_path, 'memory');
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  const filePath = path.join(dirPath, filename);
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
  if (!memory_state.memory_path) {
    throw new Error('Память не настроена');
  }
  const filePath = path.join(memory_state.memory_path, 'memory', filename);
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

module.exports = {
  memory_state,
  setLocalMemoryBasePath,
  setMemoryFolder,
  getCurrentPlan,
  writeMemoryFile,
  readMemoryFile,
  listMemoryFiles
};

// Этот модуль хранит и обновляет данные о локальной памяти.
// В дальнейшем функции можно расширить для работы с файловой системой.
