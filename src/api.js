const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const chat_commands = require('../chat_commands');
const memory = require('../memory');
const memory_mode = require('../memory_mode');

// Конфигурация API
const config = {
  memoryPath: './memory'
};

const app = express();
const PORT = 4465;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Sofia API is running.');
});

/**
 * Читает указанный файл из папки памяти
 * Запрос: GET /read?file=filename.md
 */
app.get('/read', (req, res) => {
  const filename = req.query.file;
  if (!filename) {
    return res.status(400).send('Missing file parameter');
  }

  const memory_path = path.resolve(config.memoryPath || './memory');
  const file_path = path.resolve(memory_path, filename);

  if (!file_path.startsWith(memory_path)) {
    return res.status(400).send('Invalid file path');
  }

  // Проверяем существование файла
  if (!fs.existsSync(file_path)) {
    return res.status(404).send('File not found');
  }

  try {
    const content = fs.readFileSync(file_path, 'utf8');
    return res.send(content);
  } catch (err) {
    return res.status(500).send('Unable to read file');
  }
});

/**
 * Создаёт или обновляет файл в папке памяти
 * Запрос: POST /write { file: "name.md", content: "..." }
 */
app.post('/write', (req, res) => {
  const { file, content } = req.body;
  // проверяем наличие параметров
  if (!file || !content) {
    return res.status(400).send('Missing file or content');
  }
  // базовая проверка имени файла
  if (file.includes('..') || file.includes('/') || file.includes('\\')) {
    return res.status(400).send('Invalid filename');
  }

  const memory_path = path.resolve(config.memoryPath || './memory');
  const file_path = path.join(memory_path, file);

  if (!file_path.startsWith(memory_path)) {
    return res.status(400).send('Invalid filename');
  }

  try {
    fs.mkdirSync(memory_path, { recursive: true });
    fs.writeFileSync(file_path, content, 'utf8');
    return res.send('File saved successfully');
  } catch (err) {
    return res.status(500).send('Unable to save file');
  }
});

/**
 * Сохраняет произвольный файл через API
 * Запрос: POST /save { name: "file.md", content: "..." }
 */
app.post('/save', (req, res) => {
  const { name, content } = req.body;
  if (!name || !content) {
    return res.status(400).send('Missing name or content');
  }
  try {
    chat_commands.handle_save_local_file(`/save_local_file name="${name}" content="${content}"`);
    return res.send('saved');
  } catch (err) {
    return res.status(500).send('Unable to save');
  }
});

/**
 * Читает файл через API
 * Запрос: POST /read { name: "file.md" }
 */
app.post('/read', async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).send('Missing name');
  }
  try {
    const content = await memory.readMemoryFile(name);
    return res.send(content);
  } catch (err) {
    return res.status(500).send('Unable to read');
  }
});

/**
 * Устанавливает репозиторий памяти
 * Запрос: POST /setMemoryRepo { type: "github", repo: "repo", token: "token" }
 */
app.post('/setMemoryRepo', (req, res) => {
  const { type, repo, token } = req.body;
  if (!type || !repo || !token) {
    return res.status(400).send('Missing parameters');
  }
  try {
    memory_mode.switchMemoryRepo(type, repo, token);
    return res.send('ok');
  } catch (err) {
    return res.status(500).send('Unable to set repo');
  }
});

/**
 * Сохраняет план урока
 * Запрос: POST /saveLessonPlan { filename: "plan.md" }
 */
app.post('/saveLessonPlan', (req, res) => {
  const { filename } = req.body;
  const message = filename ? `/save_memory filename="${filename}"` : '/save_memory';
  try {
    chat_commands.handle_save_memory(message);
    return res.send('ok');
  } catch (err) {
    return res.status(500).send('Unable to save plan');
  }
});

/**
 * Сохраняет файл и индекс в удалённую память
 */
app.post('/saveMemoryWithIndex', (req, res) => {
  try {
    memory_mode.saveMemoryWithIndex(req.body);
    return res.send('ok');
  } catch (err) {
    return res.status(500).send('Unable to save');
  }
});

/**
 * Сохраняет ответ в файл
 * Запрос: POST /saveAnswer { name: "answer.md", content: "..." }
 */
app.post('/saveAnswer', (req, res) => {
  const { name, content } = req.body;
  if (!name || !content) {
    return res.status(400).send('Missing parameters');
  }
  try {
    chat_commands.handle_save_local_file(`/save_local_file name="${name}" content="${content}"`);
    return res.send('ok');
  } catch (err) {
    return res.status(500).send('Unable to save answer');
  }
});

/**
 * Возвращает сохранённый токен
 */
app.post('/getToken', (req, res) => {
  return res.json({ token: memory_mode.repo_state.token });
});

/**
 * Сохраняет токен
 * Запрос: POST /setToken { token: "..." }
 */
app.post('/setToken', (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).send('Missing token');
  }
  memory_mode.repo_state.token = token;
  return res.send('ok');
});

/**
 * Загружает файл памяти в контекст
 * Запрос: POST /loadMemoryToContext { filename: "file.md" }
 */
app.post('/loadMemoryToContext', async (req, res) => {
  const { filename } = req.body;
  if (!filename) {
    return res.status(400).send('Missing filename');
  }
  try {
    await memory.loadMemoryFile(filename);
    return res.send('ok');
  } catch (err) {
    return res.status(500).send('Unable to load memory');
  }
});

/**
 * Загружает контекст из index.json
 */
app.post('/loadContextFromIndex', async (req, res) => {
  try {
    await memory.loadMemoryFile('index.json');
    return res.send('ok');
  } catch (err) {
    return res.status(500).send('Unable to load context');
  }
});

/**
 * Базовая настройка чата
 */
app.post('/chat/setup', (req, res) => {
  return res.send('ok');
});

/**
 * Обновляет индекс памяти
 */
app.post('/updateIndex', (req, res) => {
  return res.send('ok');
});

/**
 * Сохраняет инструкции в новую версию
 */
app.post('/version/commit', (req, res) => {
  return res.send('ok');
});

/**
 * Откатывает инструкции до предыдущей версии
 */
app.post('/version/rollback', (req, res) => {
  return res.send('ok');
});

/**
 * Возвращает список версий
 */
app.post('/version/list', (req, res) => {
  return res.send('ok');
});

/**
 * Возвращает информацию о профиле
 */
app.get('/profile', (req, res) => {
  return res.json({ memory: memory.memory_state, repo: memory_mode.repo_state });
});

/**
 * Проверка доступности сервера
 */
app.get('/health', (req, res) => {
  return res.send('ok');
});

/**
 * Документация API (заглушка)
 */
app.get('/docs', (req, res) => {
  return res.send('Sofia API docs');
});

/**
 * Читает активный план
 */
app.get('/plan', (req, res) => {
  try {
    const plan = memory.getCurrentPlan();
    return res.send(plan);
  } catch (err) {
    return res.status(500).send('Unable to read plan');
  }
});

/**
 * Возвращает статус токена
 */
app.get('/token/status', (req, res) => {
  return res.json({ active: memory_mode.repo_state.active });
});

/**
 * Возвращает список файлов памяти
 */
app.post('/list', async (req, res) => {
  try {
    const files = await memory.listMemoryFiles();
    return res.json({ files });
  } catch (err) {
    return res.status(500).send('Unable to list files');
  }
});

/**
 * Обрабатывает команду из запроса ?message=
 * Пример: GET /ping?message=/save_memory
 */
app.get('/ping', async (req, res) => {
  const message = req.query.message || '';
  if (!message) {
    return res.send('pong');
  }
  if (!message.startsWith('/')) {
    return res.status(400).send('Missing or invalid command');
  }

  try {
    const handled = await Promise.any([
      chat_commands.handle_save_memory(message),
      chat_commands.handle_save_local_file(message),
      chat_commands.handle_load_memory(message),
      chat_commands.handle_load_local_file(message),
      chat_commands.handle_list_local_files(message),
      chat_commands.handle_switch_memory_mode(message)
    ]);

    if (handled) {
      return res.send(`✅ Команда "${message}" обработана.`);
    } else {
      return res.status(400).send(`❌ Неизвестная команда: "${message}"`);
    }
  } catch (err) {
    return res.status(500).send(`❌ Ошибка при выполнении команды: ${err.message}`);
  }
});

app.listen(PORT, () => {
  console.log(`\uD83D\uDFE2 Sofia API started on http://localhost:${PORT}`);
});
