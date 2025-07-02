const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 4465;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Sofia API is running.');
});

app.listen(PORT, () => {
  console.log(`\uD83D\uDFE2 Sofia API started on http://localhost:${PORT}`);
});
