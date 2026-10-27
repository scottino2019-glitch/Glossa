import express, { Request, Response } from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const PUBLIC_SHEETS_DIR = path.resolve(__dirname, 'public', 'sheets');

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve public sheets directory statically with proper headers
app.use('/sheets', express.static(PUBLIC_SHEETS_DIR, {
  setHeaders: (res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
  }
}));

// API: Get HTML content of a sheet directly
app.get('/api/sheet-content', (req: Request, res: Response) => {
  try {
    const rawPath = req.query.path as string;
    if (!rawPath) {
      return res.status(400).json({ error: 'Parametro path mancante' });
    }

    const normalized = path.normalize(rawPath).replace(/^(\.\.(\/|\\|$))+/, '');
    const cleanSubpath = normalized.startsWith('/sheets/')
      ? normalized.slice('/sheets/'.length)
      : (normalized.startsWith('/') ? normalized.slice(1) : normalized);

    const fullPath = path.resolve(PUBLIC_SHEETS_DIR, cleanSubpath);

    if (!fullPath.startsWith(PUBLIC_SHEETS_DIR)) {
      return res.status(403).json({ error: 'Accesso negato' });
    }

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: `File non trovato: ${cleanSubpath}` });
    }

    const html = fs.readFileSync(fullPath, 'utf-8');
    res.json({ success: true, html });
  } catch (err) {
    console.error('Errore lettura sheet-content:', err);
    res.status(500).json({ error: 'Errore lettura file HTML' });
  }
});

// Helper to format clean human names from folder slugs (e.g. "miei-fogli" -> "Miei Fogli")
function formatTitle(slug: string): string {
  return slug
    .replace(/[-_]+/g, ' ')
    .replace(/\.[^/.]+$/, '')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Language color scheme mapping for vibrant, distinct, recognizable categories
const LANGUAGE_PALETTE: Record<string, {
  name: string;
  nativeName: string;
  accentColor: string;
  bannerBg: string;
  badgeBg: string;
  badgeText: string;
}> = {
  cinese: {
    name: 'Cinese',
    nativeName: '中文',
    accentColor: '#c2410c', // Terracotta/Carmine
    bannerBg: '#ea580c',
    badgeBg: '#ffedd5',
    badgeText: '#9a3412',
  },
  giapponese: {
    name: 'Giapponese',
    nativeName: '日本語',
    accentColor: '#1d4ed8', // Bold Royal Indigo
    bannerBg: '#2563eb',
    badgeBg: '#dbeafe',
    badgeText: '#1e40af',
  },
  coreano: {
    name: 'Coreano',
    nativeName: '한국어',
    accentColor: '#047857', // Deep Emerald Jade
    bannerBg: '#059669',
    badgeBg: '#d1fae5',
    badgeText: '#065f46',
  },
  russo: {
    name: 'Russo',
    nativeName: 'Русский',
    accentColor: '#0369a1', // Baltic Cobalt Blue
    bannerBg: '#0284c7',
    badgeBg: '#e0f2fe',
    badgeText: '#075985',
  },
  arabo: {
    name: 'Arabo',
    nativeName: 'العربية',
    accentColor: '#b45309', // Desert Amber
    bannerBg: '#d97706',
    badgeBg: '#fef3c7',
    badgeText: '#92400e',
  },
  tedesco: {
    name: 'Tedesco',
    nativeName: 'Deutsch',
    accentColor: '#15803d', // Alpine Pine
    bannerBg: '#16a34a',
    badgeBg: '#dcfce7',
    badgeText: '#166534',
  },
  'miei-fogli': {
    name: 'I Miei Fogli',
    nativeName: 'Appunti',
    accentColor: '#7c3aed', // Deep Violet
    bannerBg: '#8b5cf6',
    badgeBg: '#ede9fe',
    badgeText: '#5b21b6',
  },
};

interface ScannedSheet {
  id: string;
  language: string;
  languageName: string;
  subfolder: string;
  subfolderName: string;
  filename: string;
  filePath: string;
  title: string;
  subtitle: string;
  estimatedMinutes: number;
  tags: string[];
  lastModified: string;
  size: number;
}

// Recursive scanner for public/sheets
function scanSheetsDirectory(): {
  languages: Array<{
    id: string;
    name: string;
    nativeName: string;
    accentColor: string;
    subfolders: string[];
    sheetCount: number;
  }>;
  sheets: ScannedSheet[];
} {
  if (!fs.existsSync(PUBLIC_SHEETS_DIR)) {
    fs.mkdirSync(PUBLIC_SHEETS_DIR, { recursive: true });
  }

  const sheets: ScannedSheet[] = [];
  const languageMap = new Map<string, { subfolders: Set<string>; count: number }>();

  // Helper to extract title, subtitle, and tags from HTML string
  function parseHtmlMetadata(html: string, fallbackTitle: string): { title: string; subtitle: string; tags: string[] } {
    let title = fallbackTitle;
    let subtitle = '';
    const tags: string[] = [];

    // Extract <title>...</title>
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    if (titleMatch && titleMatch[1]?.trim()) {
      title = titleMatch[1].trim();
    } else {
      // Try <h1>
      const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
      if (h1Match && h1Match[1]?.trim()) {
        title = h1Match[1].replace(/<[^>]+>/g, '').trim();
      }
    }

    // Extract <meta name="description" content="...">
    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
    if (metaDescMatch && metaDescMatch[1]?.trim()) {
      subtitle = metaDescMatch[1].trim();
    } else {
      // First <p> tag
      const pMatch = html.match(/<p[^>]*>(.*?)<\/p>/i);
      if (pMatch && pMatch[1]?.trim()) {
        subtitle = pMatch[1].replace(/<[^>]+>/g, '').trim();
        if (subtitle.length > 130) {
          subtitle = subtitle.slice(0, 127) + '...';
        }
      }
    }

    // Extract tags from <meta name="keywords" content="...">
    const kwMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']*)["']/i);
    if (kwMatch && kwMatch[1]?.trim()) {
      kwMatch[1].split(',').forEach(t => {
        const clean = t.trim();
        if (clean) tags.push(clean);
      });
    }

    return { title, subtitle, tags };
  }

  // Walk languages
  const langEntries = fs.readdirSync(PUBLIC_SHEETS_DIR, { withFileTypes: true });

  for (const langDirent of langEntries) {
    if (!langDirent.isDirectory() || langDirent.name.startsWith('.')) continue;

    const langSlug = langDirent.name;
    const langPath = path.join(PUBLIC_SHEETS_DIR, langSlug);

    if (!languageMap.has(langSlug)) {
      languageMap.set(langSlug, { subfolders: new Set(), count: 0 });
    }

    // Walk subfolders or files directly inside language
    const subEntries = fs.readdirSync(langPath, { withFileTypes: true });

    for (const subDirent of subEntries) {
      if (subDirent.name.startsWith('.')) continue;

      if (subDirent.isDirectory()) {
        const subSlug = subDirent.name;
        languageMap.get(langSlug)!.subfolders.add(subSlug);
        const subPath = path.join(langPath, subSlug);

        const fileEntries = fs.readdirSync(subPath, { withFileTypes: true });
        for (const fileDirent of fileEntries) {
          if (fileDirent.isFile() && (fileDirent.name.endsWith('.html') || fileDirent.name.endsWith('.htm'))) {
            const filePathOnDisk = path.join(subPath, fileDirent.name);
            const stats = fs.statSync(filePathOnDisk);
            const relativeWebPath = `/sheets/${langSlug}/${subSlug}/${fileDirent.name}`;

            const htmlHeader = fs.readFileSync(filePathOnDisk, { encoding: 'utf-8', flag: 'r' }).slice(0, 6000);
            const parsed = parseHtmlMetadata(htmlHeader, formatTitle(fileDirent.name));

            const langMeta = LANGUAGE_PALETTE[langSlug] || {
              name: formatTitle(langSlug),
              nativeName: langSlug.toUpperCase(),
              accentColor: '#475569',
            };

            const autoTags = parsed.tags.length > 0 ? parsed.tags : [formatTitle(subSlug)];

            sheets.push({
              id: `${langSlug}/${subSlug}/${fileDirent.name}`,
              language: langSlug,
              languageName: langMeta.name,
              subfolder: subSlug,
              subfolderName: formatTitle(subSlug),
              filename: fileDirent.name,
              filePath: relativeWebPath,
              title: parsed.title,
              subtitle: parsed.subtitle || `Foglio di studio per ${langMeta.name} (${formatTitle(subSlug)})`,
              estimatedMinutes: Math.max(5, Math.round(stats.size / 600)),
              tags: autoTags,
              lastModified: stats.mtime.toISOString(),
              size: stats.size,
            });

            languageMap.get(langSlug)!.count++;
          }
        }
      } else if (subDirent.isFile() && (subDirent.name.endsWith('.html') || subDirent.name.endsWith('.htm'))) {
        // Direct file under language
        const filePathOnDisk = path.join(langPath, subDirent.name);
        const stats = fs.statSync(filePathOnDisk);
        const relativeWebPath = `/sheets/${langSlug}/${subDirent.name}`;
        const htmlHeader = fs.readFileSync(filePathOnDisk, { encoding: 'utf-8', flag: 'r' }).slice(0, 6000);
        const parsed = parseHtmlMetadata(htmlHeader, formatTitle(subDirent.name));

        const langMeta = LANGUAGE_PALETTE[langSlug] || {
          name: formatTitle(langSlug),
          nativeName: langSlug.toUpperCase(),
          accentColor: '#475569',
        };

        sheets.push({
          id: `${langSlug}/principale/${subDirent.name}`,
          language: langSlug,
          languageName: langMeta.name,
          subfolder: 'generale',
          subfolderName: 'Generale',
          filename: subDirent.name,
          filePath: relativeWebPath,
          title: parsed.title,
          subtitle: parsed.subtitle || `Foglio di studio per ${langMeta.name}`,
          estimatedMinutes: Math.max(5, Math.round(stats.size / 600)),
          tags: parsed.tags.length > 0 ? parsed.tags : ['Generale'],
          lastModified: stats.mtime.toISOString(),
          size: stats.size,
        });

        languageMap.get(langSlug)!.count++;
      }
    }
  }

  // Build languages summary array
  const languages = Array.from(languageMap.entries()).map(([slug, data]) => {
    const meta = LANGUAGE_PALETTE[slug] || {
      name: formatTitle(slug),
      nativeName: slug.toUpperCase(),
      accentColor: '#475569',
    };
    return {
      id: slug,
      name: meta.name,
      nativeName: meta.nativeName,
      accentColor: meta.accentColor,
      subfolders: Array.from(data.subfolders),
      sheetCount: data.count,
    };
  });

  return { languages, sheets };
}

// API: Get live directory tree of sheets (No JSON required!)
app.get('/api/sheets', (_req: Request, res: Response) => {
  try {
    const result = scanSheetsDirectory();
    res.json(result);
  } catch (err) {
    console.error('Error scanning public sheets:', err);
    res.status(500).json({ error: 'Errore durante la scansione della cartella public/sheets' });
  }
});

// API: Save or upload an HTML sheet directly to public/sheets/<language>/<subfolder>/
app.post('/api/sheets', (req: Request, res: Response) => {
  try {
    const { language, subfolder, filename, contentHtml } = req.body;

    if (!language || !filename || !contentHtml) {
      return res.status(400).json({ error: 'Parametri mancanti: language, filename o contentHtml' });
    }

    const cleanLang = language.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const cleanSub = (subfolder || 'generale').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    let cleanFile = filename.trim().replace(/[^a-zA-Z0-9._-]/g, '-');
    if (!cleanFile.endsWith('.html') && !cleanFile.endsWith('.htm')) {
      cleanFile += '.html';
    }

    const targetDir = path.join(PUBLIC_SHEETS_DIR, cleanLang, cleanSub);
    fs.mkdirSync(targetDir, { recursive: true });

    const targetFilePath = path.join(targetDir, cleanFile);
    fs.writeFileSync(targetFilePath, contentHtml, 'utf-8');

    const result = scanSheetsDirectory();
    res.json({
      success: true,
      filePath: `/sheets/${cleanLang}/${cleanSub}/${cleanFile}`,
      ...result,
    });
  } catch (err) {
    console.error('Error saving sheet to public:', err);
    res.status(500).json({ error: 'Errore durante il salvataggio del file in public/sheets' });
  }
});

// API: Delete sheet from public folder
app.delete('/api/sheets', (req: Request, res: Response) => {
  try {
    const { filePath } = req.body;
    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({ error: 'filePath mancante' });
    }

    // Safety check: ensure path stays within public/sheets
    const normalized = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
    const fullPath = path.resolve(__dirname, 'public', normalized.startsWith('/') ? normalized.slice(1) : normalized);

    if (!fullPath.startsWith(PUBLIC_SHEETS_DIR)) {
      return res.status(403).json({ error: 'Accesso negato al percorso richiesto' });
    }

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'File non trovato' });
    }
  } catch (err) {
    console.error('Error deleting sheet:', err);
    res.status(500).json({ error: 'Errore durante la cancellazione del file' });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const httpServer = http.createServer(app);

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server Glossa attivo su http://0.0.0.0:${PORT}`);
  });
}

startServer();
