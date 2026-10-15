import express from 'express';
import { createServer as createViteServer } from 'vite';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// API Endpoint to run Python unit tests
app.get('/api/run-tests', (req, res) => {
  exec('python3 -m unittest discover tests -v', { cwd: process.cwd() }, (error, stdout, stderr) => {
    const output = (stdout || '') + '\n' + (stderr || '');
    const passed = !error;
    res.json({
      success: passed,
      exitCode: error ? error.code : 0,
      output: output.trim(),
    });
  });
});

// API Endpoint to get Python files
app.get('/api/python-files', (req, res) => {
  const filePaths = [
    'parse/config/bank_profile.py',
    'parse/config/builtin_profiles.py',
    'parse/config/registry.py',
    'parse/bank_adapters/configurable_adapter.py',
    'parse/bank_adapters/hbl_adapter.py',
    'parse/bank_adapters/meezan_adapter.py',
    'parse/bank_adapters/generic_adapter.py',
    'parse/models.py',
    'parse/table_detector.py',
    'parse/date_parser.py',
    'parse/amount_parser.py',
    'parse/multiline_merger.py',
    'validate/reconciler.py',
    'ingest/classifier.py',
    'ocr/preprocessor.py',
    'ocr/engine.py',
    'cli.py',
    'review_ui/streamlit_app.py',
    'requirements.txt',
    'tests/fixtures.py',
    'tests/test_bank_configuration.py',
    'tests/test_date_parser.py',
    'tests/test_amount_parser.py',
    'tests/test_multiline_merger.py',
    'tests/test_reconciliation.py',
    'README.md',
  ];

  const files: Record<string, string> = {};
  for (const fp of filePaths) {
    const full = path.join(process.cwd(), fp);
    if (fs.existsSync(full)) {
      files[fp] = fs.readFileSync(full, 'utf-8');
    }
  }

  res.json({ files });
});

// API Endpoint to fetch registered bank configuration profiles
app.get('/api/bank-profiles', (req, res) => {
  exec(
    'python3 -c "import json; from parse.config.registry import bank_registry; print(json.dumps([p.to_dict() for p in bank_registry.list_profiles()]))"',
    { cwd: process.cwd() },
    (error, stdout, stderr) => {
      if (error) {
        return res.status(500).json({ error: stderr || error.message });
      }
      try {
        const profiles = JSON.parse(stdout);
        res.json({ profiles });
      } catch (e: any) {
        res.status(500).json({ error: 'Failed to parse profiles JSON' });
      }
    }
  );
});

// API Endpoint for Gemini Document Intelligence OCR extraction
app.post('/api/gemini-extract', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error: 'GEMINI_API_KEY is not set in environment.',
      });
    }

    const { imageBase64, mimeType, textContext } = req.body;
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are a high-accuracy bank statement OCR extraction engine.
Extract all transaction records from this bank statement.
Strictly adhere to the following output rules:
1. Return a JSON object with:
   - "bank_name": Name of the bank (e.g. "Habib Bank Limited (HBL)", "Meezan Bank Limited", or detected bank)
   - "account_number_masked": Last 4 digits (e.g. "****1100")
   - "account_title": Account holder name
   - "currency": e.g. "PKR"
   - "statement_start_date": "YYYY-MM-DD" or null
   - "statement_end_date": "YYYY-MM-DD" or null
   - "opening_balance": float number or null
   - "closing_balance": float number or null
   - "transactions": Array of objects, each containing:
       - "date": "YYYY-MM-DD" (ISO 8601. Infer missing year from statement period)
       - "description": merchant or narration. Clean whitespace, collapse multi-line wraps.
       - "amount": Signed float. Debits must be negative (e.g. -4500.00), Credits positive (e.g. 50000.00). No currency symbols.
       - "notes": Cheque number, IBAN, reference ID, or running balance if available.
       - "confidence": confidence score between 0.0 and 1.0 (float)
       - "needs_review": boolean (set true if confidence < 0.85 or uncertain date/amount)
       - "running_balance": float or null

Return ONLY raw JSON, with no markdown code blocks.`;

    const contents: any[] = [];
    if (imageBase64) {
      contents.push({
        inlineData: {
          mimeType: mimeType || 'image/png',
          data: imageBase64.replace(/^data:[^;]+;base64,/, ''),
        },
      });
    }
    if (textContext) {
      contents.push({
        text: `Bank statement text content:\n${textContext}`,
      });
    }
    contents.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contents,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return res.json({ success: true, data: parsed });
  } catch (err: any) {
    console.error('Gemini extraction error:', err);
    return res.status(500).json({
      error: err.message || 'Gemini extraction failed',
    });
  }
});

// Mount Vite middleware in development
async function startServer() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
