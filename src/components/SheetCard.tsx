import React from 'react';
import { Bookmark, CheckCircle2, Clock, Folder, Trash2, ArrowUpRight } from 'lucide-react';
import { Sheet } from '../types';

interface SheetCardProps {
  sheet: Sheet;
  accentColor: string;
  isStudied: boolean;
  isFavorite: boolean;
  onToggleStudied: (sheetId: string) => void;
  onToggleFavorite: (sheetId: string) => void;
  onSelect: (sheet: Sheet) => void;
  onDelete?: (filePath: string) => void;
}

export const SheetCard: React.FC<SheetCardProps> = ({
  sheet,
  accentColor,
  isStudied,
  isFavorite,
  onToggleStudied,
  onToggleFavorite,
  onSelect,
  onDelete,
}) => {
  return (
    <div
      onClick={() => onSelect(sheet)}
      className="group relative bg-white rounded-lg border-2 border-stone-300 hover:border-stone-500 shadow-sm transition-colors duration-150 cursor-pointer flex flex-col justify-between overflow-hidden"
    >
      {/* Top Category Accent Header Band */}
      <div
        className="px-4 py-2 text-white flex items-center justify-between font-semibold"
        style={{ backgroundColor: accentColor }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider font-bold">
            {sheet.languageName}
          </span>
          <span className="text-white/60 text-xs">•</span>
          <span className="text-xs font-medium text-white/95 flex items-center gap-1">
            <Folder className="w-3.5 h-3.5" />
            {sheet.subfolderName}
          </span>
        </div>

        {/* Study actions in header */}
        <div
          className="flex items-center gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onToggleFavorite(sheet.id)}
            className={`p-1 rounded transition-colors ${
              isFavorite ? 'text-amber-300' : 'text-white/70 hover:text-white'
            }`}
            title={isFavorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
          >
            <Bookmark className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={() => onToggleStudied(sheet.id)}
            className={`p-1 rounded transition-colors ${
              isStudied ? 'text-emerald-300' : 'text-white/70 hover:text-white'
            }`}
            title={isStudied ? 'Studiato' : 'Segna come studiato'}
          >
            <CheckCircle2 className={`w-4 h-4 ${isStudied ? 'fill-emerald-400 text-stone-900' : ''}`} />
          </button>

          {onDelete && (
            <button
              onClick={() => onDelete(sheet.filePath)}
              className="p-1 rounded text-white/60 hover:text-rose-200 transition-colors ml-1"
              title="Elimina foglio da public"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Card Body with large, clear, high-contrast typography */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Large Title */}
          <h3 className="text-base sm:text-lg font-bold text-stone-900 leading-snug mb-2 group-hover:text-stone-800">
            {sheet.title}
          </h3>

          {/* Clear Subtitle (not tiny, well contrasted) */}
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-4">
            {sheet.subtitle}
          </p>
        </div>

        {/* Tags and Subfolder breadcrumb badge */}
        <div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {sheet.tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-xs font-semibold px-2.5 py-0.5 rounded bg-stone-100 text-stone-800 border border-stone-200"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Footer Metadata */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600 font-medium">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-stone-500" />
              <span>{sheet.estimatedMinutes} min studio</span>
            </div>

            <div className="flex items-center gap-1 text-stone-700 font-semibold group-hover:translate-x-0.5 transition-transform">
              <span>Apri foglio</span>
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
