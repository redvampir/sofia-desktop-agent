const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const chat_commands = require('../chat_commands');

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
 * Обрабатывает команду из запроса ?message=
 * Пример: GET /ping?message=/save_memory
 */
app.get('/ping', async (req, res) => {
  const message = req.query.message || '';
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
