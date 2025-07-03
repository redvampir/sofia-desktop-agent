const { test } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const memory = require('../memory');

// Reset memory_state before each test
function resetState() {
  memory.memory_state.base_path = '';
  memory.memory_state.folder = '';
  memory.memory_state.memory_path = '';
}

test('setLocalMemoryBasePath throws on missing dir', () => {
  resetState();
  const nonExistent = path.join(__dirname, 'no_such_dir');
  assert.throws(() => {
    memory.setLocalMemoryBasePath(nonExistent);
  }, /Директория не найдена/);
});

test('setMemoryPath throws on missing dir', () => {
  resetState();
  const nonExistent = path.join(__dirname, 'no_such_dir');
  assert.throws(() => {
    memory.setMemoryPath(nonExistent);
  }, /Директория не найдена/);
});
