export interface LanguageMeta {
  id: string;
  name: string;
  nativeName: string;
  accentColor: string;
  subfolders: string[];
  sheetCount: number;
}

export interface Sheet {
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
  lastModified?: string;
  size?: number;
  contentHtml?: string;
  isCustom?: boolean;
}

export interface ScanResult {
  languages: LanguageMeta[];
  sheets: Sheet[];
}

export type ReaderTheme = 'pearl' | 'paper' | 'dark';
export type ReaderFont = 'sans' | 'serif' | 'mono';

export interface StudyProgress {
  studiedSheetIds: string[];
  favoriteSheetIds: string[];
  notes: Record<string, string>;
}
