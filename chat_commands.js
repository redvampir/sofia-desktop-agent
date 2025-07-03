// chat_commands.js
// Обработчик команд из чата
const memory = require('./memory');
const path = require('path');
const fs = require('fs');
const helpers = require('./helpers');

/**
 * Разбирает строку с аргументами формата key="value"
 * Аргументы:
 *     text (string): текст команды
 * Возвращает:
 *     Object — пары ключ-значение
 */
function parse_arguments(text) {
  const args = {};
  const regex = /(\w+)=\"([\s\S]*?)\"|(\w+)=([^\s]+)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match[1]) {
      args[match[1]] = match[2];
    } else if (match[3]) {
      args[match[3]] = match[4];
    }
  }
  return args;
}

/**
 * Обрабатывает команду сохранения локального файла
 * Аргументы:
 *     message (string): текст команды
 *     userId (string): идентификатор пользователя
 * Возвращает:
 *     boolean — была ли обработана команда
 */
function handle_save_local_file(message, userId = 'user') {
  if (!message.startsWith('/save_local_file')) {
    return false;
  }
  const params = parse_arguments(message);
  const filename = params.name;
  const content = params.content || '';
  if (!filename) {
    console.log('❌ Ошибка: не указано имя файла');
    return false;
  }
  try {
    if (memory.memory_state.memory_path) {
      const savedPath = memory.writeMemoryFile(filename, content);
      console.log(`✅ Успешно сохранено: ${savedPath}`);
    } else {
      console.log('❌ Ошибка: путь памяти не задан');
      return false;
    }
  } catch (err) {
    console.log('❌ Ошибка: не удалось сохранить файл');
    throw err;
  }
  return true;
}

/**
 * Обрабатывает команду ручного сохранения памяти
 * Аргументы:
 *     message (string): текст команды
 *     userId (string): идентификатор пользователя
 * Возвращает:
 *     boolean — была ли обработана команда
 */
function handle_save_memory(message, userId = 'user') {
  if (!message.startsWith('/save_memory')) {
    return false;
  }
  const params = parse_arguments(message);
  let filename = params.filename;
  if (filename && !helpers.validate_filename(filename)) {
    console.log('❌ Ошибка: имя файла должно оканчиваться на .md или .txt');
    return false;
  }
  if (!filename) {
    const date = new Date().toISOString().split('T')[0];
    filename = `memory_${date}.md`;
  }
  const content = memory.getCurrentPlan();
  try {
    if (memory.memory_state.memory_path) {
      memory.writeMemoryFile(filename, content);
      console.log(`✅ Память сохранена как "${filename}"`);
    } else {
      console.log('❌ Ошибка: путь памяти не задан');
      return false;
    }
  } catch (err) {
    console.log('❌ Ошибка: не удалось сохранить память');
    throw err;
  }
  return true;
}

/**
 * Обрабатывает команду загрузки памяти из файла
 * Аргументы:
 *     message (string): текст команды
 * Возвращает:
 *     Promise<boolean> — была ли обработана команда
 */
async function handle_load_memory(message) {
  if (!message.startsWith('/load_memory')) {
    return false;
  }
  const params = parse_arguments(message);
  const filename = params.filename;
  if (!filename || !helpers.validate_filename(filename)) {
    console.log('❌ Ошибка: укажите корректное имя файла');
    return true;
  }
  try {
    let content = '';
    if (memory.memory_state.memory_path) {
      content = await memory.loadMemoryFile(filename);
    } else {
      console.log('❌ Ошибка: путь памяти не задан');
      return true;
    }
    if (content === '') {
      console.log(`❌ Файл ${filename} пустой или недоступен.`);
    } else {
      console.log(`✅ Память "${filename}" загружена. Теперь она активна в текущей сессии.`);
    }
  } catch (err) {
    console.log(`❌ Ошибка: не удалось загрузить файл ${filename}`);
  }
  return true;
}

/**
 * Обрабатывает команду загрузки локального файла
 * Аргументы:
 *     message (string): текст команды
 * Возвращает:
 *     boolean — была ли обработана команда
 */
async function handle_load_local_file(message) {
  if (!message.startsWith('/load_local_file')) {
    return false;
  }
  const params = parse_arguments(message);
  const filename = params.name;
  if (!filename) {
    console.log('❌ Ошибка: не указано имя файла');
    return true;
  }
  try {
    const content = await memory.readMemoryFile(filename);
    const prepared = content.replace(/\\n/g, '\n');
    console.log(`📤 Загружено: ${filename}\n---\n${prepared}`);
  } catch (err) {
    console.log(`❌ Файл ${filename} не найден или недоступен.`);
  }
  return true;
}

/**
 * Обрабатывает команду перечня локальных файлов
 * Аргументы:
 *     message (string): текст команды
 * Возвращает:
 *     boolean — была ли обработана команда
 */
async function handle_list_local_files(message) {
  if (!message.startsWith('/list_local_files')) {
    return false;
  }
  if (!memory.memory_state.base_path || !memory.memory_state.folder) {
    const full = path.join(memory.memory_state.base_path || '', memory.memory_state.folder || '');
    console.log(`❌ Ошибка: Папка памяти не найдена: ${full}`);
    return true;
  }
  try {
    const files = await memory.listMemoryFiles();
    if (!files.length) {
      console.log('📂 В указанной папке нет файлов памяти.');
    } else {
      console.log('📂 Файлы в памяти:');
      files.forEach((f) => console.log(`- ${f}`));
    }
  } catch (err) {
    console.log(`❌ Ошибка: Папка памяти не найдена: ${memory.memory_state.memory_path}`);
  }
  return true;
}

module.exports = {
  handle_save_local_file,
  handle_save_memory,
  handle_load_memory,
  handle_load_local_file,
  handle_list_local_files
};

// Модуль предназначен для разбора команд из чата и их выполнения.
