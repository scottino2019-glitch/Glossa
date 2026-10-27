import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Bold,
  Check,
  ChevronLeft,
  ChevronRight,
  Code,
  Edit3,
  Folder,
  Heading2,
  Highlighter,
  Italic,
  List,
  ListOrdered,
  Maximize2,
  Minimize2,
  Plus,
  Save,
  Table,
  Trash2,
  Underline,
  Volume2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { Sheet } from '../types';
import { fetchSheetContent, saveSheetToPublic } from '../services/sheetsService';

interface ReaderViewProps {
  sheet: Sheet;
  accentColor: string;
  allSheets: Sheet[];
  onClose: () => void;
  onNavigateSheet: (sheet: Sheet) => void;
}

export const ReaderView: React.FC<ReaderViewProps> = ({
  sheet,
  accentColor,
  allSheets,
  onClose,
  onNavigateSheet,
}) => {
  // Only the designated personal notes file activates the interactive note-writing editor
  const isPersonalNotebook =
    sheet.filename === 'i-miei-appunti-personali.html' ||
    sheet.id.includes('i-miei-appunti-personali');

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [speechStatus, setSpeechStatus] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // States specific to the Personal Notebook editor
  const [noteLoadedHtml, setNoteLoadedHtml] = useState<string | null>(null);
  const [isLoadingNote, setIsLoadingNote] = useState<boolean>(isPersonalNotebook);
  const [isSavingNote, setIsSavingNote] = useState<boolean>(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string>('');
  const [editorTab, setEditorTab] = useState<'visual' | 'code'>('visual');
  const [rawCodeContent, setRawCodeContent] = useState<string>('');

  const editableRef = useRef<HTMLDivElement | null>(null);
  const isInitialSetRef = useRef<boolean>(false);

  // Callback ref: the moment the contentEditable DOM node mounts, attach innerHTML!
  const setEditableRef = useCallback(
    (node: HTMLDivElement | null) => {
      editableRef.current = node;
      if (node && noteLoadedHtml !== null && !isInitialSetRef.current) {
        node.innerHTML = noteLoadedHtml;
        isInitialSetRef.current = true;
      }
    },
    [noteLoadedHtml]
  );

  // Load note content if viewing the personal notebook
  useEffect(() => {
    if (!isPersonalNotebook) return;

    setIsLoadingNote(true);
    isInitialSetRef.current = false;

    fetchSheetContent(sheet.filePath)
      .then((html) => {
        let bodyHtml = html || '';
        const bodyMatch = bodyHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (bodyMatch && bodyMatch[1]) {
          bodyHtml = bodyMatch[1].trim();
        }

        // Clean out all unwanted placeholder strings
        bodyHtml = bodyHtml
          .replace(/Inizia a scrivere qui i tuoi appunti[^\n<]*/gi, '')
          .replace(/Inserisci termine\.\.\./g, '')
          .replace(/traslitterazione\.\.\./g, '')
          .replace(/traduzione\.\.\./g, '')
          .replace(/frase d'esempio\.\.\./g, '');

        setNoteLoadedHtml(bodyHtml);
        setRawCodeContent(html || '');
        setIsLoadingNote(false);

        // Direct population if node is already mounted
        if (editableRef.current) {
          editableRef.current.innerHTML = bodyHtml;
          isInitialSetRef.current = true;
        }
      })
      .catch((err) => {
        console.error('Errore caricamento note:', err);
        setIsLoadingNote(false);
      });
  }, [sheet.id, isPersonalNotebook, sheet.filePath]);

  // Ensure content is set whenever noteLoadedHtml is updated
  useEffect(() => {
    if (editorTab === 'visual' && editableRef.current && noteLoadedHtml !== null && !isInitialSetRef.current) {
      editableRef.current.innerHTML = noteLoadedHtml;
      isInitialSetRef.current = true;
    }
  }, [noteLoadedHtml, editorTab]);

  // Keyboard navigation & shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        if (isPersonalNotebook) {
          e.preventDefault();
          handleSaveNoteFile();
        }
        return;
      }

      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        // Allow Tab inside contentEditable table to advance or add row
        if (e.key === 'Tab' && (e.target as HTMLElement)?.isContentEditable) {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            let cell = selection.getRangeAt(0).startContainer as Node | null;
            while (cell && cell.nodeName !== 'TD' && cell.nodeName !== 'TH' && cell !== editableRef.current) {
              cell = cell.parentNode;
            }
            if (cell && (cell.nodeName === 'TD' || cell.nodeName === 'TH')) {
              e.preventDefault();
              const nextCell = cell.nextSibling as HTMLElement | null;
              if (nextCell) {
                const range = document.createRange();
                range.selectNodeContents(nextCell);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
              } else {
                const tr = cell.parentNode as HTMLElement | null;
                const nextTr = tr?.nextSibling as HTMLElement | null;
                if (nextTr) {
                  const firstCell = nextTr.querySelector('td, th');
                  if (firstCell) {
                    const range = document.createRange();
                    range.selectNodeContents(firstCell);
                    range.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(range);
                  }
                } else {
                  // End of table: automatically add new row!
                  addTableRow();
                }
              }
            }
          }
        }
        return;
      }

      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      } else if (e.key === '[') {
        goToPrev();
      } else if (e.key === ']') {
        goToNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [allSheets, sheet, isFullscreen, isPersonalNotebook]);

  const currentIndex = allSheets.findIndex((s) => s.id === sheet.id);
  const prevSheet = currentIndex > 0 ? allSheets[currentIndex - 1] : null;
  const nextSheet = currentIndex < allSheets.length - 1 ? allSheets[currentIndex + 1] : null;

  const goToPrev = () => {
    if (prevSheet) onNavigateSheet(prevSheet);
  };

  const goToNext = () => {
    if (nextSheet) onNavigateSheet(nextSheet);
  };

  // Safe Text-to-speech
  const handlePronounce = () => {
    try {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(sheet.title);
      const langMap: Record<string, string> = {
        cinese: 'zh-CN',
        giapponese: 'ja-JP',
        coreano: 'ko-KR',
        russo: 'ru-RU',
        arabo: 'ar-SA',
        tedesco: 'de-DE',
      };
      utterance.lang = langMap[sheet.language] || 'it-IT';
      utterance.rate = 0.88;
      utterance.onstart = () => setSpeechStatus(`Audio (${utterance.lang})`);
      utterance.onend = () => setSpeechStatus('');
      window.speechSynthesis.speak(utterance);
    } catch {}
  };

  // Formatting tools for personal notebook editor:
  // onMouseDown prevents losing selection focus!
  const executeFormat = (command: string, value: string | undefined = undefined) => {
    if (editorTab !== 'visual' || !editableRef.current) return;
    editableRef.current.focus();
    document.execCommand(command, false, value);
  };

  const toggleHeading2 = () => {
    if (editorTab !== 'visual' || !editableRef.current) return;
    editableRef.current.focus();

    const selection = window.getSelection();
    let isH2 = false;
    if (selection && selection.rangeCount > 0) {
      let node: Node | null = selection.getRangeAt(0).startContainer;
      while (node && node !== editableRef.current) {
        if (node.nodeName === 'H2') {
          isH2 = true;
          break;
        }
        node = node.parentNode;
      }
    }

    if (isH2) {
      const ok = document.execCommand('formatBlock', false, '<p>');
      if (!ok) document.execCommand('formatBlock', false, 'p');
    } else {
      const ok = document.execCommand('formatBlock', false, '<h2>');
      if (!ok) document.execCommand('formatBlock', false, 'h2');
    }
  };

  const toggleUnorderedList = () => {
    if (editorTab !== 'visual' || !editableRef.current) return;
    editableRef.current.focus();
    document.execCommand('insertUnorderedList', false);
  };

  const toggleOrderedList = () => {
    if (editorTab !== 'visual' || !editableRef.current) return;
    editableRef.current.focus();
    document.execCommand('insertOrderedList', false);
  };

  const insertCharacter = (char: string) => {
    if (editorTab !== 'visual') {
      setRawCodeContent((prev) => prev + char);
      return;
    }
    if (editableRef.current) {
      editableRef.current.focus();
    }
    document.execCommand('insertText', false, char);
  };

  // Insert a rich 5-row vocabulary table (NOT a single row!)
  const insertTable = () => {
    if (editorTab !== 'visual' || !editableRef.current) return;
    editableRef.current.focus();

    const tableHtml = `
      <div class="table-container" style="width: 100%; overflow-x: auto; margin: 18px 0; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #ffffff;">
        <table style="width: 100%; min-width: 500px; border-collapse: collapse; margin: 0; font-size: 14.5px;">
          <thead>
            <tr style="background: #f8fafc;">
              <th style="border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; font-weight: 600; width: 25%;">Termine / Carattere</th>
              <th style="border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; font-weight: 600; width: 25%;">Pronuncia / Pinyin</th>
              <th style="border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; font-weight: 600; width: 25%;">Significato</th>
              <th style="border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; font-weight: 600; width: 25%;">Esempio / Contesto</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style="border:1px solid #e2e8f0; padding:10px 12px;"><br></td><td style="border:1px solid #e2e8f0; padding:10px 12px;"><br></td><td style="border:1px solid #e2e8f0; padding:10px 12px;"><br></td><td style="border:1px solid #e2e8f0; padding:10px 12px;"><br></td></tr>
            <tr><td style="border:1px solid #e2e8f0; padding:10px 12px;"><br></td><td style="border:1px solid #e2e8f0; padding:10px 12px;"><br></td><td style="border:1px solid #e2e8f0; padding:10px 12px;"><br></td><td style="border:1px solid #e2e8f0; padding:10px 12px;"><br></td></tr>
            <tr><td style="border:1px solid #e2e8f0; padding:10px 12px;"><br></td><td style="border:1px solid #e2e8f0; padding:10px 12px;"><br></td><td style="border:1px solid #e2e8f0; padding:10px 12px;"><br></td><td style="border:1px solid #e2e8f0; padding:10px 12px;"><br></td></tr>
            <tr><td style="border:1px solid #e2e8f0; padding:10px 12px;"><br></td><td style="border:1px solid #e2e8f0; padding:10px 12px;"><br></td><td style="border:1px solid #e2e8f0; padding:10px 12px;"><br></td><td style="border:1px solid #e2e8f0; padding:10px 12px;"><br></td></tr>
            <tr><td style="border:1px solid #e2e8f0; padding:10px 12px;"><br></td><td style="border:1px solid #e2e8f0; padding:10px 12px;"><br></td><td style="border:1px solid #e2e8f0; padding:10px 12px;"><br></td><td style="border:1px solid #e2e8f0; padding:10px 12px;"><br></td></tr>
          </tbody>
        </table>
      </div><p><br></p>
    `;
    document.execCommand('insertHTML', false, tableHtml);
  };

  // Add a new row to the table!
  const addTableRow = () => {
    if (editorTab !== 'visual' || !editableRef.current) return;
    editableRef.current.focus();

    const selection = window.getSelection();
    let currentTable: HTMLTableElement | null = null;

    if (selection && selection.rangeCount > 0) {
      let node: Node | null = selection.getRangeAt(0).startContainer;
      while (node && node !== editableRef.current) {
        if (node.nodeName === 'TABLE') {
          currentTable = node as HTMLTableElement;
          break;
        }
        node = node.parentNode;
      }
    }

    if (!currentTable) {
      const tables = editableRef.current.querySelectorAll('table');
      if (tables.length > 0) {
        currentTable = tables[tables.length - 1];
      }
    }

    if (currentTable) {
      const tbody = currentTable.querySelector('tbody') || currentTable;
      const colCount =
        currentTable.querySelector('thead tr')?.children.length ||
        currentTable.querySelector('tr')?.children.length ||
        4;

      const newRow = document.createElement('tr');
      for (let i = 0; i < colCount; i++) {
        const cell = document.createElement('td');
        cell.style.border = '1px solid #e2e8f0';
        cell.style.padding = '10px 12px';
        cell.innerHTML = '<br>';
        newRow.appendChild(cell);
      }
      tbody.appendChild(newRow);

      const firstCell = newRow.querySelector('td');
      if (firstCell && selection) {
        const range = document.createRange();
        range.selectNodeContents(firstCell);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    } else {
      insertTable();
    }
  };

  // Clear note with ABSOLUTELY ZERO placeholder text
  const handleClearNote = () => {
    const cleanShell = `<h1>${sheet.title}</h1>\n<p><br></p>`;
    if (editableRef.current) {
      editableRef.current.innerHTML = cleanShell;
      editableRef.current.focus();
    }
    setNoteLoadedHtml(cleanShell);
    setRawCodeContent(cleanShell);
    setSaveSuccessMessage('Quaderno note pulito.');
    setTimeout(() => setSaveSuccessMessage(''), 2500);
  };

  // Save personal note changes directly into public/sheets/...
  const handleSaveNoteFile = async () => {
    setIsSavingNote(true);
    setSaveSuccessMessage('');

    let innerHtml = '';
    if (editorTab === 'visual' && editableRef.current) {
      innerHtml = editableRef.current.innerHTML;
    } else {
      innerHtml = rawCodeContent;
    }

    const finalHtmlToSave = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  <title>${sheet.title}</title>
  <meta name="description" content="Note e appunti personali di studio.">
  <style>
    *, *:before, *:after { box-sizing: border-box; }
    html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; background: #ffffff; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans SC", "Noto Sans JP", Arial, sans-serif;
      line-height: 1.75;
      color: #1e242c;
      background-color: #ffffff;
      max-width: 900px;
      margin: 0 auto;
      padding: 24px 20px 120px 20px !important;
      font-size: 16px;
    }
    @media (max-width: 640px) {
      body { padding: 16px 14px 120px 14px !important; font-size: 15px; }
      h1 { font-size: 1.55rem !important; }
      h2 { font-size: 1.25rem !important; }
    }
    h1 {
      font-size: 1.85rem;
      font-weight: 700;
      color: #0f172a;
      margin-top: 0;
      padding-bottom: 8px;
      border-bottom: 2px solid #7c3aed;
    }
    h2 {
      font-size: 1.35rem;
      font-weight: 600;
      color: #1e293b;
      margin-top: 1.8rem;
      margin-bottom: 10px;
      padding-bottom: 6px;
      border-bottom: 1px solid #e5e7eb;
    }
    .table-container {
      width: 100%;
      max-width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      margin: 18px 0;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      background-color: #ffffff;
    }
    table {
      width: 100%;
      min-width: 500px;
      border-collapse: collapse;
      margin: 0;
      font-size: 14.5px;
    }
    th, td {
      border: 1px solid #e2e8f0;
      padding: 11px 14px;
      text-align: left;
      vertical-align: middle;
    }
    th {
      background-color: #f8fafc;
      font-weight: 600;
      color: #334155;
      border-bottom: 2px solid #cbd5e1;
    }
    tr:nth-child(even) {
      background-color: #fcfdfe;
    }
    .vocab-word {
      font-weight: 600;
      color: #7c3aed;
    }
  </style>
</head>
<body>
${innerHtml}
</body>
</html>`;

    try {
      await saveSheetToPublic({
        language: sheet.language,
        subfolder: sheet.subfolder,
        filename: sheet.filename,
        contentHtml: finalHtmlToSave,
      });

      setSaveSuccessMessage('✓ Salvato su disco!');
      setTimeout(() => setSaveSuccessMessage(''), 3000);
    } catch {
      setSaveSuccessMessage('Errore salvataggio');
    } finally {
      setIsSavingNote(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#16191e] flex flex-col w-full h-[100dvh] overflow-hidden select-none">
      {/* 1. SLIM, HIGH-CONTRAST TOP BAR (42px height) */}
      {!isFullscreen && (
        <header className="h-[42px] bg-[#16191e] border-b-2 border-stone-800 text-white flex items-center justify-between px-2 sm:px-4 shrink-0 z-10 shadow-md">
          {/* Back Button & Breadcrumbs */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-stone-100 hover:bg-white text-stone-950 font-black text-xs sm:text-sm tracking-tight transition-all shadow-sm shrink-0 cursor-pointer"
              title="Torna all'elenco dei fogli (Esc)"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              <span>← Torna all'elenco</span>
            </button>

            {/* Language & Subfolder indicator */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-stone-300 truncate">
              <span
                className="font-black px-2 py-0.5 rounded text-white text-[10px] uppercase tracking-wider shrink-0"
                style={{ backgroundColor: accentColor }}
              >
                {sheet.languageName}
              </span>
              <span className="text-stone-500 font-bold">›</span>
              <span className="text-stone-300 font-semibold flex items-center gap-1 shrink-0 text-xs">
                <Folder className="w-3.5 h-3.5 text-stone-400" />
                {sheet.subfolderName}
              </span>
              <span className="text-stone-500 font-bold">›</span>
              <span className="font-bold text-white truncate max-w-xs md:max-w-md text-xs">
                {sheet.title}
              </span>
            </div>
          </div>

          {/* Right Navigation & Tools */}
          <div className="flex items-center gap-1.5 shrink-0 text-xs">
            {/* Zoom Controls for Study Sheets */}
            {!isPersonalNotebook && (
              <div className="hidden sm:flex items-center bg-[#252a33] border border-stone-700 rounded p-0.5 mr-1">
                <button
                  type="button"
                  onClick={() => setZoomLevel((prev) => Math.max(80, prev - 10))}
                  className="p-1 rounded text-stone-300 hover:text-white hover:bg-stone-700 cursor-pointer"
                  title="Riduci caratteri"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="px-1 text-[10px] font-mono font-bold text-stone-400">
                  {zoomLevel}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((prev) => Math.min(150, prev + 10))}
                  className="p-1 rounded text-stone-300 hover:text-white hover:bg-stone-700 cursor-pointer"
                  title="Ingrandisci caratteri"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Prev / Next buttons */}
            <div className="flex items-center bg-[#252a33] border border-stone-700 rounded p-0.5">
              <button
                onClick={goToPrev}
                disabled={!prevSheet}
                className="p-1 rounded text-stone-200 hover:text-white hover:bg-stone-700 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                title={prevSheet ? `Precedente: ${prevSheet.title} ([)` : 'Inizio elenco'}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-1.5 text-[11px] font-bold text-stone-300">
                {currentIndex + 1}/{allSheets.length}
              </span>
              <button
                onClick={goToNext}
                disabled={!nextSheet}
                className="p-1 rounded text-stone-200 hover:text-white hover:bg-stone-700 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                title={nextSheet ? `Successivo: ${nextSheet.title} (])` : 'Fine elenco'}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Audio Button */}
            <button
              onClick={handlePronounce}
              className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded bg-[#252a33] hover:bg-[#323946] border border-stone-700 text-stone-200 hover:text-white font-semibold transition-colors cursor-pointer"
              title="Pronuncia titolo con audio madrelingua"
            >
              <Volume2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Pronuncia</span>
            </button>

            {/* Fullscreen Button: view sheet in 100% full immersion without any header */}
            <button
              onClick={() => setIsFullscreen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 border border-stone-600 text-white font-bold transition-colors cursor-pointer"
              title="Vedi a schermo intero senza barre (100% spazio per il foglio)"
            >
              <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Schermo intero</span>
            </button>
          </div>
        </header>
      )}

      {/* 2. WRITING TOOLBAR: ONLY APPEARS ON THE PERSONAL NOTEBOOK ("i-miei-appunti-personali.html")
          Buttons use onMouseDown with preventDefault() so selection is never lost!
      */}
      {isPersonalNotebook && !isFullscreen && (
        <div className="bg-[#1c2027] border-b-2 border-purple-900/60 px-2.5 sm:px-4 py-1.5 text-white flex items-center justify-between gap-2 flex-wrap shadow-sm shrink-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-purple-300 mr-1 flex items-center gap-1">
              <Edit3 className="w-3.5 h-3.5" />
              Quaderno:
            </span>

            {/* View / Code Mode */}
            <div className="flex rounded border border-stone-700 bg-stone-900 p-0.5 text-xs mr-1">
              <button
                type="button"
                onClick={() => {
                  setEditorTab('visual');
                  setTimeout(() => {
                    if (editableRef.current) {
                      editableRef.current.innerHTML = rawCodeContent;
                    }
                  }, 0);
                }}
                className={`px-2 py-0.5 rounded font-bold transition-colors cursor-pointer ${
                  editorTab === 'visual'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                Visuale
              </button>
              <button
                type="button"
                onClick={() => {
                  if (editableRef.current) {
                    setRawCodeContent(editableRef.current.innerHTML);
                  }
                  setEditorTab('code');
                }}
                className={`px-2 py-0.5 rounded font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                  editorTab === 'code'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <Code className="w-3 h-3" />
                <span>HTML</span>
              </button>
            </div>

            {editorTab === 'visual' && (
              <>
                <div className="flex items-center gap-0.5 bg-[#262c36] p-0.5 rounded border border-stone-700">
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      executeFormat('bold');
                    }}
                    className="p-1 rounded hover:bg-stone-700 text-stone-200 cursor-pointer"
                    title="Grassetto (Ctrl+B)"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      executeFormat('italic');
                    }}
                    className="p-1 rounded hover:bg-stone-700 text-stone-200 cursor-pointer"
                    title="Corsivo (Ctrl+I)"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      executeFormat('underline');
                    }}
                    className="p-1 rounded hover:bg-stone-700 text-stone-200 cursor-pointer"
                    title="Sottolineato"
                  >
                    <Underline className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      toggleHeading2();
                    }}
                    className="p-1 rounded hover:bg-stone-700 text-stone-200 cursor-pointer"
                    title="Titolo H2 (Intestazione)"
                  >
                    <Heading2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      toggleUnorderedList();
                    }}
                    className="p-1 rounded hover:bg-stone-700 text-stone-200 cursor-pointer"
                    title="Elenco puntato (Punti elenco)"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      toggleOrderedList();
                    }}
                    className="p-1 rounded hover:bg-stone-700 text-stone-200 cursor-pointer"
                    title="Elenco numerato (1. 2. 3.)"
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      executeFormat('hiliteColor', '#fef08a');
                    }}
                    className="p-1 rounded hover:bg-stone-700 text-amber-300 cursor-pointer"
                    title="Evidenzia testo"
                  >
                    <Highlighter className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* TABLE MANAGEMENT BUTTONS */}
                <div className="flex items-center gap-1 bg-[#262c36] p-0.5 rounded border border-stone-700">
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      insertTable();
                    }}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-stone-700 text-stone-200 text-xs font-semibold cursor-pointer"
                    title="Inserisci nuova tabella con 5 righe"
                  >
                    <Table className="w-3.5 h-3.5 text-sky-400" />
                    <span>+ Tabella</span>
                  </button>

                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      addTableRow();
                    }}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-900/60 hover:bg-sky-800 text-sky-200 text-xs font-bold cursor-pointer border border-sky-700"
                    title="Aggiungi una nuova riga alla tabella corrente"
                  >
                    <Plus className="w-3 h-3 text-sky-300" />
                    <span>+ Riga</span>
                  </button>
                </div>

                {/* Tone characters */}
                <div className="hidden lg:flex items-center gap-1 bg-[#262c36] px-1.5 py-0.5 rounded border border-stone-700 text-xs">
                  <span className="text-stone-400 mr-1 text-[11px]">Toni:</span>
                  {['ā', 'á', 'ǎ', 'à', 'ō', 'é', 'ī', 'ū', '→', '★'].map((char) => (
                    <button
                      type="button"
                      key={char}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        insertCharacter(char);
                      }}
                      className="px-1.5 py-0.5 rounded hover:bg-stone-700 text-stone-100 font-bold cursor-pointer"
                    >
                      {char}
                    </button>
                  ))}
                </div>

                {/* Clear Note button */}
                <button
                  type="button"
                  onClick={handleClearNote}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#262c36] hover:bg-stone-700 text-stone-300 hover:text-rose-300 text-xs border border-stone-700 transition-colors cursor-pointer"
                  title="Svuota foglio note (cancella testo)"
                >
                  <Trash2 className="w-3 h-3 text-rose-400" />
                  <span>Svuota</span>
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {saveSuccessMessage && (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>{saveSuccessMessage}</span>
              </span>
            )}

            <button
              type="button"
              onClick={handleSaveNoteFile}
              disabled={isSavingNote}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors disabled:opacity-50 cursor-pointer"
              title="Salva modifiche nel file HTML su disco"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingNote ? 'Salvataggio...' : 'Salva nel file'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Controls in Fullscreen Mode */}
      {isFullscreen && (
        <div className="fixed top-2.5 left-3 z-50 flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded bg-stone-900/95 text-white border-2 border-stone-600 font-black text-xs sm:text-sm shadow-xl hover:bg-black backdrop-blur-md transition-all cursor-pointer"
            title="Torna all'elenco dei fogli"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span>← Torna all'elenco</span>
          </button>
          <button
            onClick={() => setIsFullscreen(false)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-stone-900/95 text-stone-200 border-2 border-stone-600 font-bold text-xs shadow-xl hover:text-white backdrop-blur-md cursor-pointer"
            title="Mostra barra"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Mostra barra</span>
          </button>
        </div>
      )}

      {/* Speech Status Alert */}
      {speechStatus && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-md bg-stone-900 border-2 border-stone-700 text-white text-xs font-bold shadow-2xl flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{speechStatus}</span>
        </div>
      )}

      {/* 3. MAIN CONTENT:
          A) Personal Notebook: Interactive Rich-Text Editor with direct ref attachment
          B) ALL Study Sheets & User-Uploaded Files: Pure native iframe rendering at full scale!
      */}
      <main className="flex-1 w-full min-h-0 relative overflow-hidden bg-white select-text">
        {isPersonalNotebook ? (
          isLoadingNote ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-white text-stone-700 gap-3">
              <div className="w-7 h-7 border-3 border-stone-700 border-t-transparent rounded-full animate-spin" />
              <p className="font-bold text-sm">Caricamento quaderno note...</p>
            </div>
          ) : (
            <div className="w-full h-full overflow-y-auto p-3 sm:p-6 bg-[#ebeef2]">
              <div className="w-full max-w-4xl mx-auto bg-white rounded-lg border-2 border-stone-300 shadow-lg p-5 sm:p-8 min-h-[75vh] mb-24">
                {editorTab === 'visual' ? (
                  <div
                    ref={setEditableRef}
                    contentEditable
                    suppressContentEditableWarning
                    className="outline-none focus:outline-none min-h-[60vh] text-stone-900 leading-relaxed text-base select-text [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:border-b-2 [&_h1]:border-purple-600 [&_h1]:pb-2 [&_h1]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:pb-1.5 [&_h2]:border-b [&_h2]:border-stone-200 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-3 [&_li]:my-1.5 [&_li]:list-item [&_table]:border-collapse [&_table]:w-full [&_table]:border [&_table]:border-stone-300 [&_th]:border [&_th]:border-stone-300 [&_th]:bg-stone-100 [&_th]:p-2.5 [&_th]:font-semibold [&_td]:border [&_td]:border-stone-300 [&_td]:p-2.5 [&_td]:min-h-[38px] [&_.table-container]:overflow-x-auto [&_.table-container]:my-4"
                    style={{
                      fontFamily:
                        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans SC", "Noto Sans JP", Arial, sans-serif',
                    }}
                  />
                ) : (
                  <textarea
                    value={rawCodeContent}
                    onChange={(e) => setRawCodeContent(e.target.value)}
                    className="w-full min-h-[60vh] font-mono text-xs p-4 rounded border border-stone-300 bg-stone-50 text-stone-900 focus:outline-none focus:border-stone-600 select-text"
                  />
                )}
              </div>
            </div>
          )
        ) : (
          /* STUDY SHEETS AND UPLOADED FILES:
             Direct iframe loading with src={sheet.filePath}.
             Full scale, zoomable, with vertical scrolling and 100% responsiveness! */
          <div
            className="w-full h-full overflow-hidden"
            style={{
              zoom: zoomLevel !== 100 ? `${zoomLevel}%` : undefined,
            }}
          >
            <iframe
              key={sheet.id}
              src={sheet.filePath}
              title={sheet.title}
              scrolling="yes"
              className="w-full h-full border-0 block bg-white"
              style={{
                width: '100%',
                height: '100%',
                display: 'block',
                border: 'none',
                WebkitOverflowScrolling: 'touch',
              }}
            />
          </div>
        )}
      </main>
    </div>
  );
};
