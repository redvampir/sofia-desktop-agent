// memory_mode.js
// Модуль для подключения памяти из GitHub

/**
 * Состояние удалённой памяти из GitHub
 * @type {{token: string, repo_link: string, active: boolean}}
 */
const github_state = {
  token: '',
  repo_link: '',
  active: false
};

/**
 * Подключает удалённую память через токен и ссылку на репозиторий
 * Аргументы:
 *     token (string): персональный токен GitHub
 *     repo (string): ссылка на репозиторий
 */
function connect_github_memory(token, repo) {
  github_state.token = token;
  github_state.repo_link = repo;
  github_state.active = true;
}

module.exports = {
  github_state,
  connect_github_memory
};

// Модуль описывает подключение к GitHub. В дальнейшем здесь может быть
// реализована синхронизация файлов и загрузка планов.
