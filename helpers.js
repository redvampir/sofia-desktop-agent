/**
 * helpers.js
 * Вспомогательные функции
 */

/**
 * Проверяет корректность имени файла памяти
 * Аргументы:
 *     name (string): имя файла
 * Возвращает:
 *     boolean — допустимо ли имя
 */
function validate_filename(name) {
  return /^[\w\-]+\.(md|txt)$/.test(name);
}

module.exports = {
  validate_filename
};

// Модуль содержит утилиты общего назначения.
