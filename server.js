const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

// POST-Endpunkt für Mailversand
app.post('/sende-vertrag', async (req, res) => {
  const { email, text } = req.body;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER, // Gmail-Adresse
      pass: process.env.MAIL_PASS  // App-Passwort
    }
  });

  try {
    await transporter.sendMail({
      from: `"La Compagna" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Ihr Vertrag mit La Compagna",
      text: text
    });
    res.status(200).send({ success: true, message: 'Mail versendet!' });
  } catch (error) {
    console.error('Fehler beim E-Mail-Versand:', error);
    res.status(500).send({ success: false, message: 'Mail fehlgeschlagen.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});


