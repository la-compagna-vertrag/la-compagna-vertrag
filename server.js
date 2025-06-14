const express = require('express');
const app = express(); //
// Vertrag generieren und als Download liefern
app.post('/sende-vertrag', isAuth, async (req, res) => {
  const { text, vorname, nachname } = req.body;

  const doc = new jsPDF();
  const lines = doc.splitTextToSize(text, 180);
  doc.text(lines, 10, 10);
  const pdfBuffer = doc.output('arraybuffer');

  const filename = `Vertrag_${vorname}_${nachname}.pdf`;
  const pdfPath = path.join(__dirname, 'uploads', filename);
  fs.writeFileSync(pdfPath, Buffer.from(pdfBuffer));

  res.json({ filename });
});
