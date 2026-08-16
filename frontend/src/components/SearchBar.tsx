import { useState, type KeyboardEvent, type ReactNode } from 'react';
import { useDictionaryStore } from '../store/useDictionaryStore';

export function SearchBar() {
  const setSearchFilters = useDictionaryStore((s) => s.setSearchFilters);
  const runSearch = useDictionaryStore((s) => s.runSearch);
  const isSearching = useDictionaryStore((s) => s.isSearching);
  const setActiveTab = useDictionaryStore((s) => s.setActiveTab);

  const [dbName, setDbName] = useState('');
  const [objectName, setObjectName] = useState('');
  const [columnName, setColumnName] = useState('');
  const [keyword, setKeyword] = useState('');

  const handleSearch = async () => {
    setSearchFilters({ dbName, objectName, columnName, keyword });
    await runSearch();
    setActiveTab(2);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="flex flex-wrap items-end gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3">
      <Field label="來源資料庫名稱">
        <input
          value={dbName}
          onChange={(e) => setDbName(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-40 rounded border border-gray-300 px-2 py-1 text-sm"
        />
      </Field>
      <Field label="來源物件名稱">
        <input
          value={objectName}
          onChange={(e) => setObjectName(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-40 rounded border border-gray-300 px-2 py-1 text-sm"
        />
      </Field>
      <Field label="欄位名稱">
        <input
          value={columnName}
          onChange={(e) => setColumnName(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-40 rounded border border-gray-300 px-2 py-1 text-sm"
        />
      </Field>
      <Field label="全欄位模糊關鍵字">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-52 rounded border border-gray-300 px-2 py-1 text-sm"
        />
      </Field>
      <button
        type="button"
        onClick={handleSearch}
        disabled={isSearching}
        className="rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isSearching ? '查詢中…' : '查詢'}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-gray-500">{label}</span>
      {children}
    </label>
  );
}
