import React from 'react';
import { Check, Palette } from 'lucide-react';
import { APP_THEMES, useTheme } from '../contexts/ThemeContext';
import { AppThemeId } from '../types/studymate';

interface ThemePickerTableProps {
  uid?: string;
  compact?: boolean;
  onSelected?: (themeId: AppThemeId) => void;
}

export const ThemePickerTable: React.FC<ThemePickerTableProps> = ({
  uid,
  compact = false,
  onSelected,
}) => {
  const { theme: activeTheme, setTheme } = useTheme();

  const handleChoose = async (id: AppThemeId) => {
    await setTheme(id, uid);
    onSelected?.(id);
  };

  return (
    <div className="bg-white border border-sm rounded-3xl overflow-hidden shadow-xs">
      <div
        className={`flex items-center justify-between gap-3 border-b border-sm-subtle bg-sm-soft ${
          compact ? 'px-4 py-3' : 'px-5 py-4'
        }`}
      >
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-sm-accent shrink-0" />
          <h3 className="font-display text-sm sm:text-base font-bold text-slate-900">
            🎨 Choose Your StudyMate Theme
          </h3>
        </div>
        <span className="text-xs text-slate-500 hidden sm:inline">
          Instant live preview across all pages
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-sm-subtle text-[11px] font-semibold text-slate-500 bg-slate-50/50">
              <th className={compact ? 'py-2.5 px-4' : 'py-3 px-5'}>Theme</th>
              <th className={compact ? 'py-2.5 px-3' : 'py-3 px-4'}>Color Palette</th>
              <th className={`${compact ? 'py-2.5 px-3' : 'py-3 px-4'} hidden sm:table-cell`}>
                Vibe
              </th>
              <th className={`${compact ? 'py-2.5 px-4' : 'py-3 px-5'} text-right`}>Style</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {APP_THEMES.map((item) => {
              const isSelected = activeTheme === item.id;
              return (
                <tr
                  key={item.id}
                  onClick={() => void handleChoose(item.id)}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? 'bg-sm-soft' : 'hover:bg-slate-50/80'
                  }`}
                >
                  <td className={compact ? 'py-3 px-4' : 'py-3.5 px-5'}>
                    <div className="flex items-center gap-2.5 whitespace-nowrap">
                      <span className="text-base" aria-hidden="true">
                        {item.emoji}
                      </span>
                      <span className="font-display font-bold text-slate-900">{item.name}</span>
                    </div>
                  </td>

                  <td className={compact ? 'py-3 px-3' : 'py-3.5 px-4'}>
                    <div className="flex items-center gap-1.5" aria-label={`${item.name} swatches`}>
                      {item.swatches.map((hex) => (
                        <span
                          key={hex}
                          className="w-5 h-5 rounded-full border border-slate-300/70 shadow-2xs shrink-0"
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </div>
                  </td>

                  <td
                    className={`${
                      compact ? 'py-3 px-3' : 'py-3.5 px-4'
                    } text-xs text-slate-600 hidden sm:table-cell`}
                  >
                    {item.vibe}
                  </td>

                  <td className={`${compact ? 'py-3 px-4' : 'py-3.5 px-5'} text-right`}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleChoose(item.id);
                      }}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap ${
                        isSelected
                          ? 'bg-sm-accent text-white'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                      <span>{isSelected ? 'Active' : 'Select'}</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
