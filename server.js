// Express server setup
const express = require('express');
const app = express();
app.use(express.static('public'));
app.listen(3000, () => console.log('Server läuft auf Port 3000'))