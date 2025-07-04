const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const chat_commands = require('../chat_commands');
const memory = require('../memory');
const config = require('../config');

const app = express();
const PORT = 4465;

app.use(cors());
app.use(express.json());
// Логирование всех запросов
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`,
    Object.keys(req.body).length ? req.body : req.query);
  next();
});

app.get('/', (req, res) => {
  res.send('Sofia API is running.');
});

/**
 * Читает указанный файл из папки памяти
 * Запрос: GET /read?file=filename.md
 */
app.get('/read', async (req, res) => {
  console.log('/read...')
  const filename = req.query.file;
  if (!filename) {
    return res.status(400).send('Missing file parameter');
  }

  try {
    console.log('Try to read...')
    const content = await memory.readMemoryFile(filename);
    console.log('Content read length:', content.length)
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
  console.log('/write...')
  const { file, content } = req.body;
  // проверяем наличие параметров
  if (!file || !content) {
    return res.status(400).send('Missing file or content');
  }
  // базовая проверка имени файла
  if (file.includes('..') || file.includes('/') || file.includes('\\')) {
    return res.status(400).send('Invalid filename');
  }

  try {
    console.log('Try to write...')
    memory.writeMemoryFile(file, content);
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
  console.log('/save...')

  const { name, content } = req.body;
  if (!name || !content) {
    return res.status(400).send('Missing name or content');
  }
  try {
    console.log('Try to save...')

    const saved = chat_commands.handle_save_local_file(`/save_local_file name="${name}" content="${content}"`);
    console.log('saved:', saved)

    if (!saved) {
      return res.status(500).send('Unable to save');
    }
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
 * Сохраняет план урока
 * Запрос: POST /saveLessonPlan { filename: "plan.md" }
 */
app.post('/saveLessonPlan', (req, res) => {
  const { filename } = req.body;
  const message = filename ? `/save_memory filename="${filename}"` : '/save_memory';
  try {
    const saved = chat_commands.handle_save_memory(message);
    if (!saved) {
      return res.status(500).send('Unable to save plan');
    }
    return res.send('ok');
  } catch (err) {
    return res.status(500).send('Unable to save plan');
  }
});

/**
 * Сохраняет файл и индекс в удалённую память
 */
app.post('/saveMemoryWithIndex', async (req, res) => {
  const { filename, content, type } = req.body;
  try {
    await memory.saveMemoryWithIndex(filename, content, type);
    return res.json({ success: true });
  } catch (err) {
    console.error('saveMemoryWithIndex:', err.message);
    return res.status(500).json({ error: err.message });
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
    const saved = chat_commands.handle_save_local_file(`/save_local_file name="${name}" content="${content}"`);
    if (!saved) {
      return res.status(500).send('Unable to save answer');
    }
    return res.send('ok');
  } catch (err) {
    return res.status(500).send('Unable to save answer');
  }
});


/**
 * Устанавливает путь к локальной памяти
 * Запрос: POST /set_local_path { path: "C:/path" }
 */
app.post('/set_local_path', (req, res) => {
  const { path: localPath } = req.body;
  if (!localPath) {
    return res.status(400).send('Missing path');
  }
  try {
    const resolved = path.resolve(localPath);
    if (!fs.existsSync(resolved)) {
      fs.mkdirSync(resolved, { recursive: true });
    }
    memory.setMemoryPath(resolved);
    config.setLocalPath(resolved);
    return res.json({ status: 'success', path: resolved });
  } catch (err) {
    console.error('set_local_path:', err.message);
    return res.status(500).json({ error: err.message });
  }
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
    const content = await memory.readMemoryFile(filename);
    return res.json({ content });
  } catch (err) {
    console.error('loadMemoryToContext:', err.message);
    return res.status(500).json({ error: err.message });
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
  try {
    memory.initializeMemory();
    return res.send('ok');
  } catch (err) {
    console.error('chat/setup:', err.message);
    return res.status(500).send('Unable to setup chat');
  }
});

/**
 * Обновляет индекс памяти
 */
app.post('/updateIndex', async (req, res) => {
  try {
    await memory.updateIndex();
    return res.send('ok');
  } catch (err) {
    console.error('updateIndex:', err.message);
    return res.status(500).send('Unable to update index');
  }
});

/**
 * Сохраняет инструкции в новую версию
 */
app.post('/version/commit', (req, res) => {
  try {
    memory.commitInstructionVersion();
    return res.send('ok');
  } catch (err) {
    console.error('version/commit:', err.message);
    return res.status(500).send('Unable to commit');
  }
});

/**
 * Откатывает инструкции до предыдущей версии
 */
app.post('/version/rollback', (req, res) => {
  try {
    memory.rollbackInstructionVersion();
    return res.send('ok');
  } catch (err) {
    console.error('version/rollback:', err.message);
    return res.status(500).send('Unable to rollback');
  }
});

/**
 * Возвращает список версий
 */
app.post('/version/list', (req, res) => {
  try {
    const versions = memory.listInstructionVersions();
    return res.json({ versions });
  } catch (err) {
    console.error('version/list:', err.message);
    return res.status(500).send('Unable to list versions');
  }
});

/**
 * Возвращает информацию о профиле
 */
app.get('/profile', (req, res) => {
  return res.json({ memory: memory.memory_state });
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
 * Возвращает список файлов по индексу
 */
app.get('/listFiles', async (req, res) => {
  const dir = req.query.path || '';
  try {
    const files = await memory.listFiles(dir);
    return res.json({ files });
  } catch (err) {
    console.error('listFiles:', err.message);
    return res.status(500).json({ error: err.message });
  }
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
      chat_commands.handle_list_local_files(message)
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
