const { spawn } = require('node:child_process');
const assert = require('node:assert');
const { test, before, after } = require('node:test');

let server;

before(async () => {
  server = spawn('node', ['index.js'], {
    env: { ...process.env, LOCAL_MEMORY_PATH: '' },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  await new Promise((resolve) => {
    server.stdout.on('data', (data) => {
      if (data.toString().includes('Sofia API started')) {
        resolve();
      }
    });
  });
});

after(async () => {
  if (server) {
    server.kill();
    await new Promise((resolve) => server.once('exit', resolve));
  }
});

test('POST /save fails without memory path', async () => {
  const res = await fetch('http://localhost:4465/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 't.md', content: 'hi' })
  });
  assert.equal(res.status, 500);
});

test('POST /saveAnswer fails without memory path', async () => {
  const res = await fetch('http://localhost:4465/saveAnswer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 't.md', content: 'hi' })
  });
  assert.equal(res.status, 500);
});

test('POST /saveLessonPlan fails without memory path', async () => {
  const res = await fetch('http://localhost:4465/saveLessonPlan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: 'plan.md' })
  });
  assert.equal(res.status, 500);
});
