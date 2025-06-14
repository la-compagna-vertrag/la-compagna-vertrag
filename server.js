const express = require('express');
const session = require('express-session');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const { PDFDocument, StandardFonts } = require('pdf-lib');
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
});

// Login
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

// Statische Inhalte
app.use('/', isAuth, express.static(path.join(__dirname, 'public')));
app.use('/uploads', isAuth, express.static(path.join(__dirname, 'uploads')));

// Musikerdaten (Excel)
app.get('/musiker', isAuth, (req, res) => {
  const wb = xlsx.readFile('./database/musiker.xlsx');
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet);
  res.json(data);
});

// Upload
app.post('/upload', isAuth, upload.array('files'), (req, res) => {
  res.json({ uploaded: req.files.map(f => f.filename) });
});

// PDF-Erstellung
app.post('/sende-vertrag', isAuth, async (req, res) => {
  const { text, vorname, nachname } = req.body;
  const filename = `Vertrag_${vorname}_${nachname}_${Date.now()}.pdf`;
  const pdfPath = path.join(__dirname, 'uploads', filename);

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 12;

  const wrapped = text.match(/.{1,100}/g) || [];
  wrapped.forEach((line, i) => {
    page.drawText(line, {
      x: 50,
      y: 800 - i * 20,
      size: fontSize,
      font
    });
  });

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(pdfPath, pdfBytes);

  res.json({ message: '✅ PDF erstellt', url: `/uploads/${filename}` });
});

// Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server läuft unter http://localhost:${PORT}`);
});
