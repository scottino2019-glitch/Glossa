import React, { useState } from 'react';
import { FileCode, FileUp, Folder, Info, Save, X } from 'lucide-react';
import { LanguageMeta, Sheet } from '../types';
import { saveSheetToPublic } from '../services/sheetsService';

interface CreatePublicSheetModalProps {
  languages: LanguageMeta[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newSheet: Sheet) => void;
}

export const CreatePublicSheetModal: React.FC<CreatePublicSheetModalProps> = ({
  languages,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [language, setLanguage] = useState<string>(languages[0]?.id || 'cinese');
  const [customLanguage, setCustomLanguage] = useState<string>('');
  const [subfolder, setSubfolder] = useState<string>('appunti');
  const [customSubfolder, setCustomSubfolder] = useState<string>('');
  const [filename, setFilename] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [contentHtml, setContentHtml] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isFileReading, setIsFileReading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [inputMode, setInputMode] = useState<'upload' | 'write'>('upload');

  if (!isOpen) return null;

  const currentLangObj = languages.find((l) => l.id === language);
  const existingSubfolders = currentLangObj?.subfolders || [];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFilename(file.name);
    const inferredTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    if (!title) {
      setTitle(inferredTitle);
    }

    setIsFileReading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setContentHtml(text);
      setIsFileReading(false);
    };
    reader.onerror = () => {
      setErrorMessage('Errore durante la lettura del file dal computer.');
      setIsFileReading(false);
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (isFileReading) {
      setErrorMessage('Lettura del file in corso, attendi un secondo...');
      return;
    }

    const targetLang = language === '__new__' ? customLanguage.trim() : language;
    const targetSub = subfolder === '__new__' ? customSubfolder.trim() : subfolder;

    if (!targetLang) {
      setErrorMessage('Specifica la lingua o cartella principale.');
      return;
    }
    if (!targetSub) {
      setErrorMessage('Specifica la sottocartella.');
      return;
    }
    if (!filename.trim()) {
      setErrorMessage('Inserisci il nome del file (es. mio-foglio.html).');
      return;
    }

    let finalHtml = contentHtml.trim();
    if (!finalHtml) {
      // Clean minimal sheet without unwanted placeholder text
      finalHtml = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  <title>${title || filename.replace('.html', '')}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.7;
      padding: 20px 16px 100px 16px;
      max-width: 900px;
      margin: 0 auto;
      color: #1e242c;
      font-size: 16px;
    }
    h1 {
      font-size: 1.8rem;
      border-bottom: 2px solid #334155;
      padding-bottom: 8px;
      margin-top: 0;
    }
  </style>
</head>
<body>
  <h1>${title || filename.replace('.html', '')}</h1>
</body>
</html>`;
    }

    setIsUploading(true);
    try {
      const cleanFilename = filename.endsWith('.html') || filename.endsWith('.htm') ? filename : `${filename}.html`;

      const scanResult = await saveSheetToPublic({
        language: targetLang,
        subfolder: targetSub,
        filename: cleanFilename,
        contentHtml: finalHtml,
      });

      const found = scanResult.sheets.find(
        (s) => s.language === targetLang && s.subfolder === targetSub && s.filename === cleanFilename
      ) || scanResult.sheets[0];

      if (found) {
        onSuccess(found);
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Errore nel salvataggio in public/sheets');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2.5 sm:p-4 overflow-y-auto">
      {/* Strictly constrained container: max-h-[88vh], never overflows the screen */}
      <div className="w-full max-w-lg max-h-[88vh] flex flex-col rounded-lg bg-white border-2 border-stone-400 shadow-2xl overflow-hidden text-stone-900 my-auto">
        {/* Header - Fixed & Compact */}
        <div className="px-4 py-2.5 bg-[#16191e] text-white flex items-center justify-between border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">
                Aggiungi Foglio HTML in Public
              </h3>
              <p className="text-[11px] text-stone-400">
                Salvataggio nella cartella <code>public/sheets/</code>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-stone-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3 text-xs">
          {errorMessage && (
            <div className="p-2 rounded bg-rose-50 text-rose-800 border border-rose-300 font-semibold text-xs">
              {errorMessage}
            </div>
          )}

          {/* Mode Switcher */}
          <div className="flex rounded border border-stone-300 overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setInputMode('upload')}
              className={`flex-1 py-1.5 font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                inputMode === 'upload'
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>Carica file .html</span>
            </button>
            <button
              type="button"
              onClick={() => setInputMode('write')}
              className={`flex-1 py-1.5 font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                inputMode === 'write'
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Incolla / Scrivi HTML</span>
            </button>
          </div>

          {/* Upload Input */}
          {inputMode === 'upload' && (
            <div className="border-2 border-dashed border-stone-300 hover:border-stone-500 rounded-lg p-3 text-center bg-stone-50 transition-colors">
              <input
                type="file"
                accept=".html,.htm"
                onChange={handleFileUpload}
                id="modal-sheet-upload"
                className="hidden"
              />
              <label
                htmlFor="modal-sheet-upload"
                className="cursor-pointer flex flex-col items-center justify-center gap-1"
              >
                <FileUp className="w-6 h-6 text-stone-600" />
                <span className="font-bold text-stone-900 text-xs sm:text-sm">
                  {filename ? filename : 'Seleziona un file HTML dal computer'}
                </span>
                <span className="text-[11px] text-stone-500">
                  {contentHtml
                    ? `✓ File caricato (${contentHtml.length} caratteri)`
                    : 'Fai clic per selezionare il file dal tuo computer'}
                </span>
              </label>
            </div>
          )}

          {/* Write Input */}
          {inputMode === 'write' && (
            <div>
              <label className="block font-bold text-stone-800 mb-1">
                Contenuto codice HTML:
              </label>
              <textarea
                rows={4}
                value={contentHtml}
                onChange={(e) => setContentHtml(e.target.value)}
                placeholder="<h1>Mio Foglio</h1><p>Contenuto di studio...</p>"
                className="w-full p-2 font-mono text-[11px] rounded border border-stone-300 focus:border-stone-600 focus:outline-none bg-stone-50"
              />
            </div>
          )}

          {/* Category & Subfolder */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <div>
              <label className="block font-bold text-stone-800 mb-1">
                Lingua / Cartella:
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full p-1.5 text-xs rounded border border-stone-300 focus:border-stone-600 focus:outline-none bg-white font-medium"
              >
                {languages.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.id})
                  </option>
                ))}
                <option value="__new__">+ Nuova cartella lingua...</option>
              </select>

              {language === '__new__' && (
                <input
                  type="text"
                  placeholder="Nome cartella lingua (es. latino)"
                  value={customLanguage}
                  onChange={(e) => setCustomLanguage(e.target.value)}
                  className="mt-1.5 w-full p-1.5 text-xs rounded border border-stone-300 focus:border-stone-600 focus:outline-none"
                />
              )}
            </div>

            <div>
              <label className="block font-bold text-stone-800 mb-1">
                Sottocartella:
              </label>
              <select
                value={subfolder}
                onChange={(e) => setSubfolder(e.target.value)}
                className="w-full p-1.5 text-xs rounded border border-stone-300 focus:border-stone-600 focus:outline-none bg-white font-medium"
              >
                {existingSubfolders.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
                <option value="appunti">appunti</option>
                <option value="grammatica">grammatica</option>
                <option value="vocabolario">vocabolario</option>
                <option value="scrittura">scrittura</option>
                <option value="__new__">+ Nuova sottocartella...</option>
              </select>

              {subfolder === '__new__' && (
                <input
                  type="text"
                  placeholder="Nome sottocartella (es. dialoghi)"
                  value={customSubfolder}
                  onChange={(e) => setCustomSubfolder(e.target.value)}
                  className="mt-1.5 w-full p-1.5 text-xs rounded border border-stone-300 focus:border-stone-600 focus:outline-none"
                />
              )}
            </div>
          </div>

          {/* Filename & Optional Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block font-bold text-stone-800 mb-1">
                Nome file:
              </label>
              <input
                type="text"
                placeholder="es. appunti-verbi.html"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="w-full p-1.5 text-xs rounded border border-stone-300 focus:border-stone-600 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-800 mb-1">
                Titolo visualizzato (opzionale):
              </label>
              <input
                type="text"
                placeholder="es. Appunti Verbi e Modi"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-1.5 text-xs rounded border border-stone-300 focus:border-stone-600 focus:outline-none"
              />
            </div>
          </div>
        </form>

        {/* Footer - Fixed */}
        <div className="px-4 py-2 bg-stone-100 border-t border-stone-300 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-stone-500 truncate max-w-[180px] sm:max-w-xs font-mono">
            public/sheets/{language}/{subfolder}/
          </span>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded text-stone-700 hover:bg-stone-200 font-bold transition-colors text-xs cursor-pointer"
            >
              Annulla
            </button>
            <button
              onClick={handleSubmit}
              disabled={isUploading || isFileReading}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-stone-900 hover:bg-stone-800 text-white font-bold transition-colors text-xs shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isUploading ? 'Salvataggio...' : 'Salva in Public'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
