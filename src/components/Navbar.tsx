import React, { useRef, useState, useEffect } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, FolderSync, Plus, Search, X } from 'lucide-react';
import { LanguageMeta } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  languages: LanguageMeta[];
  selectedLanguage: string | null;
  onSelectLanguage: (langId: string | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRefreshPublic: () => void;
  isRefreshing: boolean;
  onOpenCreateModal: () => void;
  totalSheetsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  languages,
  selectedLanguage,
  onSelectLanguage,
  searchQuery,
  onSearchChange,
  onRefreshPublic,
  isRefreshing,
  onOpenCreateModal,
  totalSheetsCount,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(false);

  // Check scroll positions
  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [languages]);

  const handleScrollLeft = () => {
    scrollContainerRef.current?.scrollBy({ left: -240, behavior: 'smooth' });
    setTimeout(checkScroll, 300);
  };

  const handleScrollRight = () => {
    scrollContainerRef.current?.scrollBy({ left: 240, behavior: 'smooth' });
    setTimeout(checkScroll, 300);
  };

  // Enable mouse wheel horizontal scrolling
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY !== 0 && scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft += e.deltaY;
      checkScroll();
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#16191e] text-stone-100 border-b-2 border-stone-800 shadow-md select-none">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3">
        {/* Upper Row: Brand & Global Actions */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-[#252a33] border border-stone-700 flex items-center justify-center text-white">
              <BookOpen className="w-5 h-5 text-stone-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white">GLOSSA</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 border border-stone-700 font-medium">
                  {totalSheetsCount} fogli in public
                </span>
              </div>
              <p className="text-[11px] text-stone-400 font-normal hidden sm:block">
                Caricamento automatico da cartella public con sottocartelle
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <PWAInstallButton />

            <button
              onClick={onRefreshPublic}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-200 hover:text-white bg-[#262c36] hover:bg-[#303844] border border-stone-700 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
              title="Scansiona automaticamente la cartella public/sheets"
            >
              <FolderSync className={`w-4 h-4 text-sky-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Ricarica public</span>
            </button>

            <button
              onClick={onOpenCreateModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-stone-700 hover:bg-stone-600 border border-stone-600 rounded-md transition-colors shadow-xs cursor-pointer"
              title="Aggiungi nuovo file HTML direttamente in public/sheets"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Salva in public</span>
            </button>
          </div>
        </div>

        {/* Lower Row: Languages Navigation & Search with explicit scroll buttons and wheel support */}
        <div className="mt-3 pt-2.5 border-t border-stone-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Scrollable Language Bar with Arrow Navigators */}
          <div className="flex-1 min-w-0 flex items-center gap-1 relative">
            {/* Left Scroll Button */}
            <button
              type="button"
              onClick={handleScrollLeft}
              disabled={!canScrollLeft}
              className={`p-1.5 rounded-md bg-[#252a33] border border-stone-700 text-stone-300 hover:text-white hover:bg-stone-700 shrink-0 transition-opacity cursor-pointer ${
                canScrollLeft ? 'opacity-100' : 'opacity-25 pointer-events-none'
              }`}
              title="Scorri lingue a sinistra"
              aria-label="Scorri a sinistra"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {/* Scrollable Chips Container */}
            <div
              ref={scrollContainerRef}
              onScroll={checkScroll}
              onWheel={handleWheel}
              className="flex-1 flex items-center gap-1.5 overflow-x-auto py-1 text-xs scroll-smooth scrollbar-thin scrollbar-thumb-stone-700 scrollbar-track-transparent"
              style={{
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'thin',
              }}
            >
              <button
                onClick={() => onSelectLanguage(null)}
                className={`px-3 py-1.5 rounded-md font-bold transition-colors whitespace-nowrap text-xs cursor-pointer shrink-0 ${
                  selectedLanguage === null
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-300 hover:text-white hover:bg-[#252a33]'
                }`}
              >
                Tutte le lingue
              </button>

              {languages.map((lang) => {
                const isSelected = selectedLanguage === lang.id;
                return (
                  <button
                    key={lang.id}
                    onClick={() => onSelectLanguage(isSelected ? null : lang.id)}
                    className={`px-3 py-1.5 rounded-md font-bold transition-colors whitespace-nowrap flex items-center gap-2 text-xs cursor-pointer shrink-0 ${
                      isSelected
                        ? 'bg-white text-stone-900 shadow-sm'
                        : 'text-stone-300 hover:text-white hover:bg-[#252a33]'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: lang.accentColor }}
                    />
                    <span>{lang.name}</span>
                    <span className="text-[11px] opacity-75 font-normal">
                      ({lang.sheetCount})
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right Scroll Button */}
            <button
              type="button"
              onClick={handleScrollRight}
              disabled={!canScrollRight}
              className={`p-1.5 rounded-md bg-[#252a33] border border-stone-700 text-stone-300 hover:text-white hover:bg-stone-700 shrink-0 transition-opacity cursor-pointer ${
                canScrollRight ? 'opacity-100' : 'opacity-25 pointer-events-none'
              }`}
              title="Scorri lingue a destra"
              aria-label="Scorri a destra"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[220px] max-w-xs shrink-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cerca per titolo o regola..."
              className="w-full bg-[#20252d] text-stone-100 text-xs pl-9 pr-8 py-1.5 sm:py-2 rounded-md border border-stone-700 focus:outline-none focus:border-stone-400 focus:bg-[#252b35] placeholder-stone-400 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
