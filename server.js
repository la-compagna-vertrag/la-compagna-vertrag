const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
  res.status(404).send('Seite nicht gefunden');
});

app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
