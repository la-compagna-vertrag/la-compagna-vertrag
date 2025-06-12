const express = require('express');
const session = require('express-session');
const multer = require('multer');
const nodemailer = require('nodemailer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const { jsPDF } = require('jspdf');
require('dotenv').config();

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));

const isAuth = (req, res, next) => {
  if (req.session.loggedIn) return next();
  res.redirect('/login');
};

// Login-Seite
app.get('/login', (req, res) => {
  res.send(`<form method="POST" action="/login" style="margin:2em;font-family:sans-serif">
              <h2>La Compagna Login</h2>
              <input name="username" placeholder="Benutzername" required /><br><br>
              <input name="password" type="password" placeholder="Passwort" required /><br><br>
              <button type="submit">Login</button>
            </form>`);
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.LOGIN_USER && password === process.env.LOGIN_PASS) {
    req.session.loggedIn = true;
    res.redirect('/');
  } else {
    res.send('Zugang verweigert');
  }
});

// Sichtbare HTML-Seite im Root
app.use('/', isAuth, express.static(path.join(__dirname, 'public')));
app.use('/uploads', isAuth, express.static(path.join(__dirname, 'uploads')));

// Musiker-Datenbank (Excel → JSON)
app.get('/musiker', isAuth, (req, res) => {
  const wb = xlsx.readFile('./database/musiker.xlsx');
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet);
  res.json(data);
});

// Datei-Upload
app.post('/upload', isAuth, upload.array('files'), (req, res) => {
  res.json({ uploaded: req.files.map(f => f.filename) });
});

// Vertrag per Mail + PDF speichern
app.post('/sende-vertrag', isAuth, async (req, res) => {
  const { email, text, vorname, nachname } = req.body;

  // PDF erzeugen
  const doc = new jsPDF();
  const lines = doc.splitTextToSize(text, 180);
  doc.text(lines, 10, 10);
  const pdfBuffer = doc.output('arraybuffer');

  // PDF lokal speichern
  const filename = `Vertrag_${vorname}_${nachname}.pdf`;
  const pdfPath = path.join(__dirname, 'uploads', filename);
  fs.writeFileSync(pdfPath, Buffer.from(pdfBuffer));

  // E-Mail-Versand
  const transporter = nodemailer.createTransport({
    service: 'gmail', // Achtung: evtl. durch z. B. smtp.ethereal.email ersetzen!
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  });

  try {
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: [email, 'deine.email@beispiel.ch'], // Kopie an Admin-Adresse eintragen
      subject: "Dein Orchestervertrag – La Compagna",
      text: "Anbei dein Vertrag als PDF.",
      attachments: [{
        filename,
        content: Buffer.from(pdfBuffer),
        contentType: 'application/pdf'
      }]
    });

    res.json({ message: '✅ E-Mail an Musiker
