/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Bookmark,
  CheckCircle2,
  Filter,
  Folder,
  FolderSync,
  Layers,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { LanguageMeta, Sheet, StudyProgress } from './types';
import {
  deleteSheetFromPublic,
  FALLBACK_SCAN_RESULT,
  loadStudyProgress,
  saveStudyProgress,
  scanPublicSheets,
} from './services/sheetsService';
import { Navbar } from './components/Navbar';
import { SheetCard } from './components/SheetCard';
import { ReaderView } from './components/ReaderView';
import { CreatePublicSheetModal } from './components/CreatePublicSheetModal';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  const [languages, setLanguages] = useState<LanguageMeta[]>(FALLBACK_SCAN_RESULT.languages);
  const [sheets, setSheets] = useState<Sheet[]>(FALLBACK_SCAN_RESULT.sheets);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [refreshMessage, setRefreshMessage] = useState<string>('');

  // Filtering states
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [selectedSubfolder, setSelectedSubfolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterTab, setFilterTab] = useState<'all' | 'unstudied' | 'studied' | 'favorites'>('all');

  // Reader state
  const [activeSheet, setActiveSheet] = useState<Sheet | null>(null);

  // Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // Study Progress
  const [progress, setProgress] = useState<StudyProgress>(() => loadStudyProgress());

  // Automatic scan of public/sheets folder
  const handleScanPublic = async (showNotification = true) => {
    setIsRefreshing(true);
    try {
      const data = await scanPublicSheets();
      if (data.languages && data.languages.length > 0) {
        setLanguages(data.languages);
      }
      if (data.sheets && data.sheets.length > 0) {
        setSheets(data.sheets);
        if (showNotification) {
          setRefreshMessage(`Scansione completata: ${data.sheets.length} fogli rilevati nelle sottocartelle di public`);
        }
      }
    } catch {
      if (showNotification) {
        setRefreshMessage('Scansione cartella public completata (dati locali)');
      }
    } finally {
      setIsRefreshing(false);
      if (showNotification) {
        setTimeout(() => setRefreshMessage(''), 4000);
      }
    }
  };

  useEffect(() => {
    handleScanPublic(false);
  }, []);

  // When language changes, reset subfolder filter
  useEffect(() => {
    setSelectedSubfolder(null);
  }, [selectedLanguage]);

  const handleToggleStudied = (sheetId: string) => {
    setProgress((prev) => {
      const isAlreadyStudied = prev.studiedSheetIds.includes(sheetId);
      const nextStudied = isAlreadyStudied
        ? prev.studiedSheetIds.filter((id) => id !== sheetId)
        : [...prev.studiedSheetIds, sheetId];

      const updated = { ...prev, studiedSheetIds: nextStudied };
      saveStudyProgress(updated);
      return updated;
    });
  };

  const handleToggleFavorite = (sheetId: string) => {
    setProgress((prev) => {
      const isAlreadyFav = prev.favoriteSheetIds.includes(sheetId);
      const nextFav = isAlreadyFav
        ? prev.favoriteSheetIds.filter((id) => id !== sheetId)
        : [...prev.favoriteSheetIds, sheetId];

      const updated = { ...prev, favoriteSheetIds: nextFav };
      saveStudyProgress(updated);
      return updated;
    });
  };

  const handleSaveNote = (sheetId: string, text: string) => {
    setProgress((prev) => {
      const updated = {
        ...prev,
        notes: { ...prev.notes, [sheetId]: text },
      };
      saveStudyProgress(updated);
      return updated;
    });
  };

  const handleDeleteSheet = async (filePath: string) => {
    try {
      await deleteSheetFromPublic(filePath);
      await handleScanPublic(false);
      setRefreshMessage(`Foglio eliminato da public: ${filePath.split('/').pop()}`);
      if (activeSheet?.filePath === filePath) {
        setActiveSheet(null);
      }
    } catch {
      setRefreshMessage('Impossibile eliminare il file da public');
    }
  };

  // Selected language object
  const currentLangObj = useMemo(() => {
    if (!selectedLanguage) return null;
    return languages.find((l) => l.id === selectedLanguage) || null;
  }, [languages, selectedLanguage]);

  // Available subfolders for the current filter view
  const availableSubfolders = useMemo(() => {
    if (currentLangObj) {
      return currentLangObj.subfolders;
    }
    // All unique subfolders across all sheets
    const set = new Set<string>();
    sheets.forEach((s) => set.add(s.subfolder));
    return Array.from(set);
  }, [currentLangObj, sheets]);

  // Filter sheets
  const filteredSheets = useMemo(() => {
    return sheets.filter((sheet) => {
      // Language filter
      if (selectedLanguage && sheet.language !== selectedLanguage) {
        return false;
      }

      // Subfolder filter
      if (selectedSubfolder && sheet.subfolder !== selectedSubfolder) {
        return false;
      }

      // Status tab
      const isStudied = progress.studiedSheetIds.includes(sheet.id);
      const isFav = progress.favoriteSheetIds.includes(sheet.id);

      if (filterTab === 'studied' && !isStudied) return false;
      if (filterTab === 'unstudied' && isStudied) return false;
      if (filterTab === 'favorites' && !isFav) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = sheet.title.toLowerCase().includes(q);
        const inSub = sheet.subtitle.toLowerCase().includes(q);
        const inLang = sheet.languageName.toLowerCase().includes(q);
        const inFolder = sheet.subfolderName.toLowerCase().includes(q);
        const inTags = sheet.tags.some((t) => t.toLowerCase().includes(q));
        if (!inTitle && !inSub && !inLang && !inFolder && !inTags) {
          return false;
        }
      }

      return true;
    });
  }, [sheets, selectedLanguage, selectedSubfolder, filterTab, searchQuery, progress]);

  // Group filtered sheets by Subfolder for clear, logical structure!
  const groupedBySubfolder = useMemo(() => {
    const map = new Map<string, Sheet[]>();
    filteredSheets.forEach((sheet) => {
      const key = `${sheet.languageName} • ${sheet.subfolderName}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(sheet);
    });
    return Array.from(map.entries());
  }, [filteredSheets]);

  // Accent color map
  const getAccentColor = (langId: string) => {
    const l = languages.find((lang) => lang.id === langId);
    return l?.accentColor || '#334155';
  };

  return (
    <div className="min-h-screen bg-[#dce1e8] text-stone-900 flex flex-col font-sans">
      {/* If Reader Mode is active, render ReaderView */}
      {activeSheet ? (
        <ReaderView
          sheet={activeSheet}
          accentColor={getAccentColor(activeSheet.language)}
          allSheets={filteredSheets.length > 0 ? filteredSheets : sheets}
          onClose={() => setActiveSheet(null)}
          onNavigateSheet={(next) => setActiveSheet(next)}
        />
      ) : (
        <>
          {/* High-contrast Graphite Navbar */}
          <Navbar
            languages={languages}
            selectedLanguage={selectedLanguage}
            onSelectLanguage={(langId) => setSelectedLanguage(langId)}
            searchQuery={searchQuery}
            onSearchChange={(q) => setSearchQuery(q)}
            onRefreshPublic={() => handleScanPublic(true)}
            isRefreshing={isRefreshing}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            totalSheetsCount={sheets.length}
          />

          {/* Feedback banner */}
          {refreshMessage && (
            <div className="bg-[#181b20] text-emerald-400 text-xs py-2 px-4 text-center border-b border-stone-800 flex items-center justify-center gap-2 font-bold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{refreshMessage}</span>
            </div>
          )}

          {/* Main Content Area with solid contrast */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
            {/* Language Banner if specific language is selected */}
            {currentLangObj && (
              <div className="rounded-lg bg-white border-2 border-stone-400 p-5 mb-6 shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-4 h-10 rounded-xs"
                      style={{ backgroundColor: currentLangObj.accentColor }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-black text-stone-900 tracking-tight">
                          {currentLangObj.name}
                        </h2>
                        <span className="text-sm font-bold text-stone-500">
                          ({currentLangObj.nativeName})
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 font-medium mt-0.5">
                        Cartella radice: <code>public/sheets/{currentLangObj.id}/</code>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold text-stone-700 bg-stone-100 px-3 py-1.5 rounded-md border border-stone-300">
                    <Folder className="w-4 h-4 text-stone-600" />
                    <span>{currentLangObj.subfolders.length} sottocartelle • {currentLangObj.sheetCount} fogli</span>
                  </div>
                </div>

                {/* Subfolder Chips inside current language */}
                {currentLangObj.subfolders.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-stone-200 flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-stone-600 mr-1 flex items-center gap-1">
                      <Folder className="w-3.5 h-3.5" />
                      Sottocartella:
                    </span>
                    <button
                      onClick={() => setSelectedSubfolder(null)}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                        selectedSubfolder === null
                          ? 'bg-stone-900 text-white shadow-xs'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-300'
                      }`}
                    >
                      Tutte ({sheets.filter((s) => s.language === currentLangObj.id).length})
                    </button>
                    {currentLangObj.subfolders.map((sub) => {
                      const count = sheets.filter(
                        (s) => s.language === currentLangObj.id && s.subfolder === sub
                      ).length;
                      return (
                        <button
                          key={sub}
                          onClick={() => setSelectedSubfolder(selectedSubfolder === sub ? null : sub)}
                          className={`px-3 py-1 rounded-md text-xs font-bold transition-colors capitalize ${
                            selectedSubfolder === sub
                              ? 'bg-stone-900 text-white shadow-xs'
                              : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-300'
                          }`}
                        >
                          {sub} ({count})
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Filter Bar: Status tabs & Subfolder filter for "Tutte le lingue" */}
            <div className="bg-white rounded-lg border-2 border-stone-400 p-3.5 mb-6 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
              {/* Study Status Tabs */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-stone-500 font-bold mr-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-stone-700" />
                  Stato:
                </span>
                <button
                  onClick={() => setFilterTab('all')}
                  className={`px-3 py-1.5 rounded-md font-bold transition-colors ${
                    filterTab === 'all'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-800 hover:bg-stone-200 border border-stone-300'
                  }`}
                >
                  Tutti ({sheets.length})
                </button>
                <button
                  onClick={() => setFilterTab('unstudied')}
                  className={`px-3 py-1.5 rounded-md font-bold transition-colors ${
                    filterTab === 'unstudied'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-800 hover:bg-stone-200 border border-stone-300'
                  }`}
                >
                  Da studiare
                </button>
                <button
                  onClick={() => setFilterTab('studied')}
                  className={`px-3 py-1.5 rounded-md font-bold transition-colors flex items-center gap-1.5 ${
                    filterTab === 'studied'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-800 hover:bg-stone-200 border border-stone-300'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Studiati ({progress.studiedSheetIds.length})</span>
                </button>
                <button
                  onClick={() => setFilterTab('favorites')}
                  className={`px-3 py-1.5 rounded-md font-bold transition-colors flex items-center gap-1.5 ${
                    filterTab === 'favorites'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-800 hover:bg-stone-200 border border-stone-300'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5 text-amber-600" />
                  <span>Preferiti ({progress.favoriteSheetIds.length})</span>
                </button>
              </div>

              {/* Subfolder filter for all languages view */}
              {!selectedLanguage && availableSubfolders.length > 0 && (
                <div
                  onWheel={(e) => {
                    if (e.deltaY !== 0) {
                      e.currentTarget.scrollLeft += e.deltaY;
                    }
                  }}
                  className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-thin"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                >
                  <span className="text-stone-500 font-bold shrink-0">Sottocartelle:</span>
                  <button
                    onClick={() => setSelectedSubfolder(null)}
                    className={`px-2 py-1 rounded text-[11px] font-bold shrink-0 cursor-pointer ${
                      selectedSubfolder === null
                        ? 'bg-stone-800 text-white'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-300'
                    }`}
                  >
                    Tutte
                  </button>
                  {availableSubfolders.map((sub) => (
                    <button
                      key={sub}
                      onClick={() => setSelectedSubfolder(selectedSubfolder === sub ? null : sub)}
                      className={`px-2 py-1 rounded text-[11px] font-bold capitalize whitespace-nowrap shrink-0 cursor-pointer ${
                        selectedSubfolder === sub
                          ? 'bg-stone-800 text-white'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-300'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Structured Organization by Language / Subfolder */}
            {filteredSheets.length > 0 ? (
              <div className="space-y-8">
                {groupedBySubfolder.map(([groupLabel, groupSheets]) => {
                  const sampleSheet = groupSheets[0];
                  const accent = getAccentColor(sampleSheet.language);

                  return (
                    <section key={groupLabel} className="space-y-3">
                      {/* Section Header with crisp contrast */}
                      <div className="flex items-center justify-between pb-2 border-b-2 border-stone-400">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: accent }}
                          />
                          <h3 className="text-base font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
                            <span>{groupLabel}</span>
                          </h3>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-stone-300 text-stone-800">
                            {groupSheets.length} {groupSheets.length === 1 ? 'foglio' : 'fogli'}
                          </span>
                        </div>

                        <span className="text-xs text-stone-600 font-medium hidden sm:inline">
                          <code>/public/sheets/{sampleSheet.language}/{sampleSheet.subfolder}/</code>
                        </span>
                      </div>

                      {/* Grid of high-contrast cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {groupSheets.map((sheet) => (
                          <SheetCard
                            key={sheet.id}
                            sheet={sheet}
                            accentColor={accent}
                            isStudied={progress.studiedSheetIds.includes(sheet.id)}
                            isFavorite={progress.favoriteSheetIds.includes(sheet.id)}
                            onToggleStudied={handleToggleStudied}
                            onToggleFavorite={handleToggleFavorite}
                            onSelect={(s) => setActiveSheet(s)}
                            onDelete={handleDeleteSheet}
                          />
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border-2 border-stone-400 bg-white p-12 text-center text-stone-700 my-8 shadow-sm">
                <p className="text-base font-bold text-stone-900 mb-1">
                  Nessun foglio trovato con i filtri correnti
                </p>
                <p className="text-xs text-stone-600 mb-5">
                  {searchQuery
                    ? `Nessun risultato per "${searchQuery}". Prova un termine diverso o azzera i filtri.`
                    : 'Non ci sono fogli che corrispondono alla sottocartella o allo stato selezionato.'}
                </p>
                <div className="flex items-center justify-center gap-3">
                  {(searchQuery || selectedLanguage || selectedSubfolder || filterTab !== 'all') && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedLanguage(null);
                        setSelectedSubfolder(null);
                        setFilterTab('all');
                      }}
                      className="px-4 py-2 rounded-md bg-stone-200 hover:bg-stone-300 text-stone-900 text-xs font-bold"
                    >
                      Azzera filtri
                    </button>
                  )}
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-4 py-2 rounded-md bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold"
                  >
                    Salva nuovo foglio in public
                  </button>
                </div>
              </div>
            )}
          </main>

          {/* Minimal contrast footer */}
          <footer className="mt-auto border-t-2 border-stone-800 bg-[#16191e] text-stone-300 py-3.5 px-4 text-center text-xs select-none">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
              <span className="font-semibold text-stone-200">
                <strong>GLOSSA</strong> • Fogli di studio linguistico organizzati per cartelle e sottocartelle
              </span>
              <span className="text-stone-400 font-medium">
                Caricamento automatico da <code>public/sheets/</code> • Nessun file JSON richiesto • PWA Offline
              </span>
            </div>
          </footer>
        </>
      )}

      {/* Create / Upload Sheet in Public Modal */}
      <CreatePublicSheetModal
        languages={languages}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(savedSheet) => {
          handleScanPublic(true);
          setActiveSheet(savedSheet);
        }}
      />

      {/* Offline Toast */}
      <OfflineIndicator />
    </div>
  );
}
