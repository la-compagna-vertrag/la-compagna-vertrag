app.post('/sende-vertrag', isAuth, async (req, res) => {
  const { email, text, vorname, nachname } = req.body;

  const doc = new jsPDF();
  const lines = doc.splitTextToSize(text, 180);
  doc.text(lines, 10, 10);
  const pdfBuffer = doc.output('arraybuffer');

  const filename = `Vertrag_${vorname}_${nachname}.pdf`;
  const pdfPath = path.join(__dirname, 'uploads', filename);
  fs.writeFileSync(pdfPath, Buffer.from(pdfBuffer));

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  });

  try {
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: [email, 'deine.email@beispiel.ch'],
      subject: "Dein Orchestervertrag – La Compagna",
      text: "Anbei dein Vertrag als PDF.",
      attachments: [{
        filename,
        content: Buffer.from(pdfBuffer),
        contentType: 'application/pdf'
      }]
    });

    res.json({ message: 'E-Mail an Musiker & Kopie an Organisation gesendet. PDF gespeichert.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Fehler beim E-Mail-Versand.' });
  }
});

