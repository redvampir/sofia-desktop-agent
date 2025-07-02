// memory.js
// Модуль для работы с локальной памятью
const fs = require('fs');
const path = require('path');

/**
 * Объект состояния локальной памяти
 * @type {{memory_path: string, last_plan: string}}
 */
const memory_state = {
  memory_path: '',
  last_plan: ''
};

/**
 * Проверяет доступность указанной папки и устанавливает её в качестве памяти
 * Аргументы:
 *     folder (string): путь до папки памяти
 */
function set_memory_path(folder) {
  const resolved = path.resolve(folder);
  fs.accessSync(resolved, fs.constants.R_OK | fs.constants.W_OK);
  memory_state.memory_path = resolved;
}

/**
 * Переключается на другую папку памяти после проверки доступности
 * Аргументы:
 *     folder (string): путь до новой папки
 */
function switch_memory_folder(folder) {
  const resolved = path.resolve(folder);
  fs.accessSync(resolved, fs.constants.R_OK | fs.constants.W_OK);
  memory_state.memory_path = resolved;
}

/**
 * Возвращает текущий план или сообщение по умолчанию
 * Возвращает:
 *     string — путь файла плана или текст по умолчанию
 */
function get_current_plan() {
  return memory_state.last_plan || 'План отсутствует';
}

module.exports = {
  memory_state,
  set_memory_path,
  switch_memory_folder,
  get_current_plan
};

// Этот модуль хранит и обновляет данные о локальной памяти.
// В дальнейшем функции можно расширить для работы с файловой системой.
