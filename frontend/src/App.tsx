import { useEffect, type ReactNode } from 'react';
import { SearchBar } from './components/SearchBar';
import { GridListTab } from './components/tabs/GridListTab';
import { HeaderDetailTab } from './components/tabs/HeaderDetailTab';
import { useDictionaryStore } from './store/useDictionaryStore';

function App() {
  const activeTab = useDictionaryStore((s) => s.activeTab);
  const setActiveTab = useDictionaryStore((s) => s.setActiveTab);
  const runSearch = useDictionaryStore((s) => s.runSearch);

  useEffect(() => {
    runSearch();
  }, [runSearch]);

  return (
    <div className="flex h-screen flex-col bg-white text-gray-900">
      <header className="border-b border-gray-200 px-4 py-2">
        <h1 className="text-base font-semibold text-gray-800">DatabaseDictionary 資料庫字典維護工具</h1>
      </header>

      <SearchBar />

      <div className="flex border-b border-gray-200 bg-white px-4">
        <TabButton active={activeTab === 1} onClick={() => setActiveTab(1)}>
          表頭／表身維護
        </TabButton>
        <TabButton active={activeTab === 2} onClick={() => setActiveTab(2)}>
          Grid 查詢列表
        </TabButton>
      </div>

      <main className="flex-1 overflow-auto">
        {activeTab === 1 ? <HeaderDetailTab /> : <GridListTab />}
      </main>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-b-2 px-4 py-2 text-sm font-medium ${
        active ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  );
}

export default App;
