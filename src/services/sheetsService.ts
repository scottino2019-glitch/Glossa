import { LanguageMeta, ScanResult, Sheet, StudyProgress } from '../types';

const STORAGE_KEY_PROGRESS = 'glossa_study_progress_v2';
const STORAGE_KEY_OFFLINE_CACHE = 'glossa_scanned_sheets_cache_v2';

// Built-in fallback so the app works seamlessly even if offline or service worker cached
export const FALLBACK_SCAN_RESULT: ScanResult = {
  languages: [
    {
      id: 'cinese',
      name: 'Cinese',
      nativeName: '中文',
      accentColor: '#c2410c',
      subfolders: ['caratteri', 'grammatica'],
      sheetCount: 2,
    },
    {
      id: 'giapponese',
      name: 'Giapponese',
      nativeName: '日本語',
      accentColor: '#1d4ed8',
      subfolders: ['sillabari', 'particelle'],
      sheetCount: 2,
    },
    {
      id: 'coreano',
      name: 'Coreano',
      nativeName: '한국어',
      accentColor: '#047857',
      subfolders: ['alfabeto-e-suoni', 'grammatica'],
      sheetCount: 2,
    },
    {
      id: 'russo',
      name: 'Russo',
      nativeName: 'Русский',
      accentColor: '#0369a1',
      subfolders: ['alfabeto-e-suoni', 'grammatica-e-casi'],
      sheetCount: 2,
    },
    {
      id: 'arabo',
      name: 'Arabo',
      nativeName: 'العربية',
      accentColor: '#b45309',
      subfolders: ['scrittura'],
      sheetCount: 1,
    },
    {
      id: 'tedesco',
      name: 'Tedesco',
      nativeName: 'Deutsch',
      accentColor: '#15803d',
      subfolders: ['declinazioni'],
      sheetCount: 1,
    },
    {
      id: 'miei-fogli',
      name: 'I Miei Fogli',
      nativeName: 'Appunti',
      accentColor: '#7c3aed',
      subfolders: ['note-studio'],
      sheetCount: 1,
    },
  ],
  sheets: [
    {
      id: 'cinese/caratteri/caratteri-fondamentali-hsk1.html',
      language: 'cinese',
      languageName: 'Cinese',
      subfolder: 'caratteri',
      subfolderName: 'Caratteri',
      filename: 'caratteri-fondamentali-hsk1.html',
      filePath: '/sheets/cinese/caratteri/caratteri-fondamentali-hsk1.html',
      title: 'Caratteri Fondamentali e Radicali HSK 1',
      subtitle: 'I 50 ideogrammi essenziali con pinyin, radicali ed esempi visivi',
      estimatedMinutes: 8,
      tags: ['Caratteri', 'Radicali', 'Pinyin'],
    },
    {
      id: 'cinese/grammatica/grammatica-struttura-frase.html',
      language: 'cinese',
      languageName: 'Cinese',
      subfolder: 'grammatica',
      subfolderName: 'Grammatica',
      filename: 'grammatica-struttura-frase.html',
      filePath: '/sheets/cinese/grammatica/grammatica-struttura-frase.html',
      title: 'Sintassi Cinese: Ordine Frase e Particelle',
      subtitle: 'Regola Tempo-Luogo-Azione, particelle 的, 了 e domande con 吗',
      estimatedMinutes: 10,
      tags: ['Sintassi', 'Particelle', 'Regole'],
    },
    {
      id: 'giapponese/sillabari/hiragana-katakana-mnemonici.html',
      language: 'giapponese',
      languageName: 'Giapponese',
      subfolder: 'sillabari',
      subfolderName: 'Sillabari',
      filename: 'hiragana-katakana-mnemonici.html',
      filePath: '/sheets/giapponese/sillabari/hiragana-katakana-mnemonici.html',
      title: 'Hiragana & Katakana: Tavola Mnemonica',
      subtitle: 'I 46 suoni base, dakuten, handakuten e suoni contratti yōon',
      estimatedMinutes: 9,
      tags: ['Hiragana', 'Katakana', 'Fonetica'],
    },
    {
      id: 'giapponese/particelle/particelle-essenziali-n5.html',
      language: 'giapponese',
      languageName: 'Giapponese',
      subfolder: 'particelle',
      subfolderName: 'Particelle',
      filename: 'particelle-essenziali-n5.html',
      filePath: '/sheets/giapponese/particelle/particelle-essenziali-n5.html',
      title: 'Guida alle Particelle Giapponesi Fondamentali',
      subtitle: 'La distinzione cruciale tra は (wa) e が (ga), を, に, で, と',
      estimatedMinutes: 11,
      tags: ['Particelle', 'N5', 'Grammatica'],
    },
    {
      id: 'coreano/alfabeto-e-suoni/hangul-guida-suoni.html',
      language: 'coreano',
      languageName: 'Coreano',
      subfolder: 'alfabeto-e-suoni',
      subfolderName: 'Alfabeto e Suoni',
      filename: 'hangul-guida-suoni.html',
      filePath: '/sheets/coreano/alfabeto-e-suoni/hangul-guida-suoni.html',
      title: 'Hangul (한글): Guida Fono-Grafica',
      subtitle: 'Vocali base e composte, consonanti tese e aspirate, batchim finale',
      estimatedMinutes: 10,
      tags: ['Hangul', 'Batchim', 'Fonetica'],
    },
    {
      id: 'coreano/grammatica/coniugazione-verbi-cortesia.html',
      language: 'coreano',
      languageName: 'Coreano',
      subfolder: 'grammatica',
      subfolderName: 'Grammatica',
      filename: 'coniugazione-verbi-cortesia.html',
      filePath: '/sheets/coreano/grammatica/coniugazione-verbi-cortesia.html',
      title: 'Livelli di Formalità e Coniugazione Cortese',
      subtitle: 'Stile formale (합니다) e informale cortese (해요) con armonia vocalica',
      estimatedMinutes: 12,
      tags: ['Verbi', 'Cortesia', 'Coniugazione'],
    },
    {
      id: 'russo/alfabeto-e-suoni/alfabeto-cirillico-fonetica.html',
      language: 'russo',
      languageName: 'Russo',
      subfolder: 'alfabeto-e-suoni',
      subfolderName: 'Alfabeto e Suoni',
      filename: 'alfabeto-cirillico-fonetica.html',
      filePath: '/sheets/russo/alfabeto-e-suoni/alfabeto-cirillico-fonetica.html',
      title: 'Alfabeto Cirillico e Fonetica Slava',
      subtitle: 'Le 33 lettere, false amiche, vocali dure vs molli e i segni ъ e ь',
      estimatedMinutes: 7,
      tags: ['Cirillico', 'Fonetica', 'Lettere'],
    },
    {
      id: 'russo/grammatica-e-casi/i-sei-casi-russi.html',
      language: 'russo',
      languageName: 'Russo',
      subfolder: 'grammatica-e-casi',
      subfolderName: 'Grammatica e Casi',
      filename: 'i-sei-casi-russi.html',
      filePath: '/sheets/russo/grammatica-e-casi/i-sei-casi-russi.html',
      title: 'I 6 Casi della Lingua Russa: Schema Operativo',
      subtitle: 'Domande guida (Кто? Кого? Кому? etc.), desinenze e casi animati',
      estimatedMinutes: 14,
      tags: ['Casi', 'Declinazione', 'Grammatica'],
    },
    {
      id: 'arabo/scrittura/alfabeto-arabo-forme.html',
      language: 'arabo',
      languageName: 'Arabo',
      subfolder: 'scrittura',
      subfolderName: 'Scrittura',
      filename: 'alfabeto-arabo-forme.html',
      filePath: '/sheets/arabo/scrittura/alfabeto-arabo-forme.html',
      title: 'Alfabeto Arabo: Le 4 Forme Contestuali',
      subtitle: 'Lettere isolate, iniziali, mediane, finali e le 6 non leganti',
      estimatedMinutes: 11,
      tags: ['Scrittura', 'Abjad', 'Lettere'],
    },
    {
      id: 'tedesco/declinazioni/declinazione-articoli-quattro-casi.html',
      language: 'tedesco',
      languageName: 'Tedesco',
      subfolder: 'declinazioni',
      subfolderName: 'Declinazioni',
      filename: 'declinazione-articoli-quattro-casi.html',
      filePath: '/sheets/tedesco/declinazioni/declinazione-articoli-quattro-casi.html',
      title: 'I 4 Casi Tedeschi e Declinazione Articoli',
      subtitle: 'Formula RESE NESE MRMN SRSR per der, die, das ed ein/eine',
      estimatedMinutes: 9,
      tags: ['Articoli', 'Casi', 'Declinazione'],
    },
    {
      id: 'miei-fogli/note-studio/i-miei-appunti-personali.html',
      language: 'miei-fogli',
      languageName: 'I Miei Fogli',
      subfolder: 'note-studio',
      subfolderName: 'Note Studio',
      filename: 'i-miei-appunti-personali.html',
      filePath: '/sheets/miei-fogli/note-studio/i-miei-appunti-personali.html',
      title: 'I Miei Appunti Personali di Studio',
      subtitle: 'Foglio di lavoro per raccogliere vocaboli ed esercizi mirati',
      estimatedMinutes: 5,
      tags: ['Personale', 'Appunti'],
      isCustom: true,
    },
  ],
};

// Automatic scan of public/sheets (NO JSON CONFIGURATION NEEDED!)
export async function scanPublicSheets(): Promise<ScanResult> {
  try {
    const res = await fetch('/api/sheets', { cache: 'no-cache' });
    if (!res.ok) {
      throw new Error(`Status ${res.status}`);
    }
    const data: ScanResult = await res.json();
    if (data.sheets && data.sheets.length > 0) {
      localStorage.setItem(STORAGE_KEY_OFFLINE_CACHE, JSON.stringify(data));
      return data;
    }
    throw new Error('Nessun foglio restituito');
  } catch (err) {
    console.warn('Scansione API fallita, utilizzo cache o fallback locale:', err);
    try {
      const cached = localStorage.getItem(STORAGE_KEY_OFFLINE_CACHE);
      if (cached) return JSON.parse(cached);
    } catch {}
    return FALLBACK_SCAN_RESULT;
  }
}

// Save a sheet directly into public/sheets/<language>/<subfolder>/<filename>.html
export async function saveSheetToPublic(params: {
  language: string;
  subfolder: string;
  filename: string;
  contentHtml: string;
}): Promise<ScanResult> {
  const res = await fetch('/api/sheets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Impossibile salvare il foglio in public/sheets');
  }

  const updated: ScanResult = await res.json();
  localStorage.setItem(STORAGE_KEY_OFFLINE_CACHE, JSON.stringify(updated));
  return updated;
}

// Delete a sheet from public/sheets
export async function deleteSheetFromPublic(filePath: string): Promise<void> {
  const res = await fetch('/api/sheets', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filePath }),
  });

  if (!res.ok) {
    throw new Error('Impossibile eliminare il foglio');
  }
}

// Fetch the HTML body of a sheet
export async function fetchSheetContent(filePath: string): Promise<string> {
  // First try API route which reads file directly from filesystem
  try {
    const apiRes = await fetch(`/api/sheet-content?path=${encodeURIComponent(filePath)}`, { cache: 'no-cache' });
    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data.html) return data.html;
    }
  } catch {
    // fallback to static fetch below
  }

  // Fallback: static fetch
  const res = await fetch(filePath, { cache: 'no-cache' });
  if (!res.ok) {
    throw new Error(`Impossibile leggere il file ${filePath} (status ${res.status})`);
  }
  return await res.text();
}

// Progress and Notes
export function loadStudyProgress(): StudyProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROGRESS);
    if (!raw) return { studiedSheetIds: [], favoriteSheetIds: [], notes: {} };
    return JSON.parse(raw);
  } catch {
    return { studiedSheetIds: [], favoriteSheetIds: [], notes: {} };
  }
}

export function saveStudyProgress(progress: StudyProgress): void {
  localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(progress));
}
