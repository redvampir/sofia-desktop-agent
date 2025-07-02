const inquirer = require('inquirer');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
let config = require('./config');

async function promptMenu() {
  const answers = await inquirer.prompt({
    type: 'list',
    name: 'action',
    message: 'Select an action:',
    choices: [
      'Set memory path',
      'Check memory path',
      'Connect to chat',
      'Exit'
    ]
  });

  switch (answers.action) {
    case 'Set memory path':
      await setMemoryPath();
      break;
    case 'Check memory path':
      checkMemoryPath();
      break;
    case 'Connect to chat':
      connectToChat();
      break;
    case 'Exit':
      console.log(chalk.green('Goodbye!'));
      process.exit(0);
  }

  promptMenu();
}

async function setMemoryPath() {
  const answer = await inquirer.prompt({
    type: 'input',
    name: 'path',
    message: 'Enter path to local memory:'
  });
  config.memoryPath = answer.path;
  console.log(chalk.blue(`Memory path set to: ${config.memoryPath}`));
}

function checkMemoryPath() {
  if (!config.memoryPath) {
    console.log(chalk.red('Memory path is not set.'));
    return;
  }
  if (fs.existsSync(path.resolve(config.memoryPath))) {
    console.log(chalk.green('Memory path is accessible.'));
  } else {
    console.log(chalk.red('Memory path does not exist or is inaccessible.'));
  }
}

function connectToChat() {
  console.log(chalk.yellow('Connecting to chat...'));
  // Placeholder for chat connection logic
  config.lastProject = 'default';
  console.log(chalk.green('Connected to chat.'));
}

promptMenu();

