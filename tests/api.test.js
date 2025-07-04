const { spawn } = require('node:child_process');
const assert = require('node:assert');
const { test, before, after } = require('node:test');
const fs = require('fs');
const os = require('os');
const path = require('path');

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

test('setup and version API', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mem-'));

  let res = await fetch('http://localhost:4465/set_local_path', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: tmp })
  });
  assert.equal(res.status, 200);

  res = await fetch('http://localhost:4465/chat/setup', { method: 'POST' });
  assert.equal(res.status, 200);

  res = await fetch('http://localhost:4465/write', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file: 'other.md', content: 'hi' })
  });
  assert.equal(res.status, 200);

  res = await fetch('http://localhost:4465/updateIndex', { method: 'POST' });
  assert.equal(res.status, 200);

  res = await fetch('http://localhost:4465/listFiles');
  const files = (await res.json()).files;
  assert.ok(files.some((f) => f.path === 'memory/other.md'));

  res = await fetch('http://localhost:4465/saveMemoryWithIndex', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: 'memory/instructions.md', content: 'v1', type: 'instructions' })
  });
  assert.equal(res.status, 200);

  res = await fetch('http://localhost:4465/version/commit', { method: 'POST' });
  assert.equal(res.status, 200);

  res = await fetch('http://localhost:4465/saveMemoryWithIndex', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: 'memory/instructions.md', content: 'v2', type: 'instructions' })
  });
  assert.equal(res.status, 200);

  res = await fetch('http://localhost:4465/version/rollback', { method: 'POST' });
  assert.equal(res.status, 200);

  res = await fetch('http://localhost:4465/read', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'instructions.md' })
  });
  const text = await res.text();
  assert.equal(text, 'v1');

  res = await fetch('http://localhost:4465/version/list', { method: 'POST' });
  const versions = (await res.json()).versions;
  assert.ok(Array.isArray(versions));
  assert.ok(versions.length >= 1);
});

test('path traversal is blocked', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mem-'));

  let res = await fetch('http://localhost:4465/set_local_path', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: tmp })
  });
  assert.equal(res.status, 200);

  res = await fetch('http://localhost:4465/chat/setup', { method: 'POST' });
  assert.equal(res.status, 200);

  res = await fetch('http://localhost:4465/saveMemoryWithIndex', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: '../evil.md', content: 'bad' })
  });
  assert.equal(res.status, 500);

  const abs = path.join(tmp, 'abs.md');
  res = await fetch('http://localhost:4465/saveMemoryWithIndex', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: abs, content: 'bad' })
  });
  assert.equal(res.status, 500);

  res = await fetch('http://localhost:4465/read', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: '../evil.md' })
  });
  assert.equal(res.status, 500);
});

test('POST /loadMemoryToContext returns saved content', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mem-'));

  let res = await fetch('http://localhost:4465/set_local_path', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: tmp })
  });
  assert.equal(res.status, 200);

  res = await fetch('http://localhost:4465/chat/setup', { method: 'POST' });
  assert.equal(res.status, 200);

  res = await fetch('http://localhost:4465/write', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file: 'context.md', content: 'context data' })
  });
  assert.equal(res.status, 200);

  res = await fetch('http://localhost:4465/loadMemoryToContext', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: 'context.md' })
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.content, 'context data');
});

test('saveMemoryWithIndex creates file and updates index', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mem-'));

  let res = await fetch('http://localhost:4465/set_local_path', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: tmp })
  });
  assert.equal(res.status, 200);

  res = await fetch('http://localhost:4465/saveMemoryWithIndex', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: 'memory/test.md', content: 'hello', type: 'memory' })
  });
  assert.equal(res.status, 200);

  const filePath = path.join(tmp, 'memory', 'test.md');
  assert.ok(fs.existsSync(filePath));

  const indexPath = path.join(tmp, 'index.json');
  assert.ok(fs.existsSync(indexPath));
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  const entry = index.find((e) => e.path === 'memory/test.md');
  assert.ok(entry);
  assert.equal(entry.title, 'test');
});
