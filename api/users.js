import { google } from 'googleapis';

export default async function handler(req, res) {
  // Configuración de credenciales desde Variables de Entorno (Vercel)
  // Debes configurar GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY y GOOGLE_SHEET_ID en tu panel de Vercel
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'); // Fix para saltos de linea
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!clientEmail || !privateKey || !sheetId) {
    return res.status(500).json({ error: 'Faltan variables de entorno del servidor' });
  }

  try {
    // Autenticación con Google
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // --- GET: Leer Usuarios ---
    if (req.method === 'GET') {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'A:C', // Asumimos columnas: Usuario, Password, Rol
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        return res.status(200).json([]);
      }

      // Convertir filas a objetos (saltando el encabezado si existe)
      // Asumimos formato simple: [USERNAME, PASS, ROLE]
      const users = rows.map(row => ({
        username: row[0],
        pass: row[1],
        role: row[2]
      })).filter(u => u.username !== 'USUARIO'); // Filtrar header si dice USUARIO

      return res.status(200).json(users);
    }

    // --- POST: Crear Usuario ---
    if (req.method === 'POST') {
      const { username, pass, role } = req.body;

      if (!username || !pass || !role) {
        return res.status(400).json({ error: 'Datos incompletos' });
      }

      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: 'A:C',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[username, pass, role]],
        },
      });

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Google Sheets API Error:', error);
    return res.status(500).json({ error: 'Error conectando con Google Sheets', details: error.message });
  }
}