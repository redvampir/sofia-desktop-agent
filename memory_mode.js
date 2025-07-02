// memory_mode.js
// Модуль для подключения памяти из GitHub

/**
 * Состояние удалённой памяти из GitHub
 * @type {{type: string, token: string, repo: string, active: boolean}}
*/
const repo_state = {
  type: '',
  token: '',
  repo: '',
  active: false
};

/**
 * Подключает удалённую память через токен и ссылку на репозиторий
 * Аргументы:
 *     token (string): персональный токен GitHub
 *     repo (string): ссылка на репозиторий
 */
function switchMemoryRepo(type = 'github', repo, token) {
  if (type !== 'github') {
    throw new Error('Поддерживается только GitHub');
  }
  repo_state.type = type;
  repo_state.token = token;
  repo_state.repo = repo;
  repo_state.active = true;
}

module.exports = {
  repo_state,
  switchMemoryRepo
};

// Модуль описывает подключение к GitHub. В дальнейшем здесь может быть
// реализована синхронизация файлов и загрузка планов.
