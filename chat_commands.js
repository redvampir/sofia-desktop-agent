// chat_commands.js
// Обработчик команд из чата
const memory = require('./memory');
const memory_mode = require('./memory_mode');
const path = require('path');
const fs = require('fs');

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
    return true;
  }
  try {
    if (memory_mode.current_mode === 'github') {
      memory_mode.saveMemoryWithIndex({
        repo: memory_mode.repo_state.repo,
        token: memory_mode.repo_state.token,
        filename,
        content,
        userId,
        type: memory_mode.repo_state.type
      });
      console.log(`✅ Успешно сохранено: ${filename}`);
    } else if (memory_mode.current_mode === 'local' && memory.memory_state.memory_path) {
      const savedPath = memory.writeMemoryFile(filename, content);
      console.log(`✅ Успешно сохранено: ${savedPath}`);
    } else {
      console.log('❌ Ошибка: не выбран режим памяти');
    }
  } catch (err) {
    console.log('❌ Ошибка: не удалось сохранить файл');
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
  if (memory_mode.current_mode === 'github') {
    console.log('❗ Активен GitHub-режим. Загрузка из локального файла невозможна.');
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
  if (memory_mode.current_mode === 'github') {
    console.log('⚠️ Команда /list_local_files доступна только в локальном режиме памяти.');
    return true;
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

/**
 * Обрабатывает команду переключения режима памяти
 * Аргументы:
 *     message (string): текст команды
 * Возвращает:
 *     boolean — была ли обработана команда
 */
function handle_switch_memory_mode(message) {
  if (!message.startsWith('/switch_memory_mode')) {
    return false;
  }
  const params = parse_arguments(message);
  const mode = params.mode;
  if (mode !== 'local' && mode !== 'github') {
    console.log('❌ Ошибка: допустимые значения mode=local или mode=github');
    return true;
  }
  if (mode === 'github') {
    if (!memory_mode.repo_state.active) {
      console.log('❌ Репозиторий GitHub не подключен. Используйте команду `/set_repo` перед переключением.');
      return true;
    }
    memory_mode.current_mode = 'github';
    console.log('✅ Память переключена в режим: GITHUB');
  } else {
    if (!memory.memory_state.base_path) {
      console.log('❌ Базовый путь не задан. Используйте команду `/set_local_path` перед переключением.');
      return true;
    }
    memory_mode.current_mode = 'local';
    console.log('✅ Память переключена в режим: LOCAL');
  }
  return true;
}

module.exports = {
  handle_save_local_file,
  handle_load_local_file,
  handle_list_local_files,
  handle_switch_memory_mode
};

// Модуль предназначен для разбора команд из чата и их выполнения.
