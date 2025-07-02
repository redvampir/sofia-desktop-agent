// console_interface.js
// Основной CLI для взаимодействия с агентом Софии
const inquirer = require('inquirer');
const chalk = require('chalk');
const memory = require('./memory');
const memory_mode = require('./memory_mode');

/**
 * Запрашивает у пользователя действие и выполняет выбранную команду
 */
async function main_menu() {
  const answer = await inquirer.prompt({
    type: 'list',
    name: 'action',
    message: 'Выберите действие:',
    choices: [
      { name: '📁 Задать папку памяти', value: 'set_memory_path' },
      { name: '📂 Переключиться на другую память', value: 'switch_memory_folder' },
      { name: '🧠 Подключить GitHub память', value: 'connect_github' },
      { name: '📄 Показать текущий план/контекст', value: 'show_plan' },
      { name: '🚪 Выйти', value: 'exit' }
    ]
  });

  switch (answer.action) {
    case 'set_memory_path':
      await ask_set_memory();
      break;
    case 'switch_memory_folder':
      await ask_switch_memory();
      break;
    case 'connect_github':
      await ask_connect_github();
      break;
    case 'show_plan':
      show_plan();
      break;
    case 'exit':
      console.log(chalk.green('До свидания!'));
      process.exit(0);
  }

  show_status();
  main_menu();
}

/**
 * Запрашивает путь к папке памяти и устанавливает его
 */
async function ask_set_memory() {
  const { folder } = await inquirer.prompt({
    type: 'input',
    name: 'folder',
    message: 'Введите путь к папке памяти:'
  });
  try {
    memory.setLocalMemoryBasePath(folder);
    console.log(chalk.green('✅ Успешно подключено: ' + folder));
  } catch (err) {
    console.log(chalk.red('❌ Ошибка: ' + err.message));
  }
}

/**
 * Запрашивает новый путь и переключает память
 */
async function ask_switch_memory() {
  const { folder } = await inquirer.prompt({
    type: 'input',
    name: 'folder',
    message: 'Введите название проекта/чата:'
  });
  try {
    memory.setMemoryFolder(folder);
    console.log(chalk.green('✅ Успешно подключено: ' + folder));
  } catch (err) {
    console.log(chalk.red('❌ Ошибка: ' + err.message));
  }
}

/**
 * Запрашивает данные для подключения GitHub памяти
 */
async function ask_connect_github() {
  const answers = await inquirer.prompt([
    { type: 'input', name: 'repo', message: 'Ссылка на репозиторий:' },
    { type: 'password', name: 'token', message: 'GitHub токен (опционально):' }
  ]);
  try {
    memory_mode.switchMemoryRepo('github', answers.repo, answers.token);
    console.log(chalk.green('✅ Успешно подключено: ' + answers.repo));
  } catch (err) {
    console.log(chalk.red('❌ Ошибка: ' + err.message));
  }
}

/**
 * Выводит текущий план/контекст
 */
function show_plan() {
  console.log(chalk.blue('Текущий план:\n' + memory.getCurrentPlan()));
}

/**
 * Отображает текущее состояние памяти
 */
function show_status() {
  const type = memory_mode.repo_state.active ? memory_mode.repo_state.type : 'Локальная';
  console.log(chalk.yellow(`Активная память: ${type}`));
  console.log(chalk.yellow(`Путь: ${memory.memory_state.memory_path || 'не задан'}`));
}

main_menu();

// CLI предназначен для демонстрации работы с локальной и удалённой памятью.
// При расширении можно добавить дополнительные команды и обработчики.
