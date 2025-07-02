// chat_commands.js
// Обработчик команд из чата
const memory = require('./memory');
const memory_mode = require('./memory_mode');

/**
 * Разбирает строку с аргументами формата key="value"
 * Аргументы:
 *     text (string): текст команды
 * Возвращает:
 *     Object — пары ключ-значение
 */
function parse_arguments(text) {
  const args = {};
  const regex = /(\w+)="([\s\S]*?)"/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    args[match[1]] = match[2];
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
    if (memory_mode.repo_state.active) {
      memory_mode.saveMemoryWithIndex({
        repo: memory_mode.repo_state.repo,
        token: memory_mode.repo_state.token,
        filename,
        content,
        userId,
        type: memory_mode.repo_state.type
      });
      console.log(`✅ Успешно сохранено: ${filename}`);
    } else if (memory.memory_state.memory_path) {
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

module.exports = {
  handle_save_local_file
};

// Модуль предназначен для разбора команд из чата и их выполнения.
