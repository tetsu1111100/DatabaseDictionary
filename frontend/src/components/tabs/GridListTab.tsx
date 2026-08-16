import { useDictionaryStore } from '../../store/useDictionaryStore';

export function GridListTab() {
  const results = useDictionaryStore((s) => s.searchResults);
  const isSearching = useDictionaryStore((s) => s.isSearching);
  const loadHeader = useDictionaryStore((s) => s.loadHeader);

  return (
    <div className="overflow-auto p-4">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-300 bg-gray-100 text-left text-gray-600">
            <th className="px-3 py-2 font-medium">資料庫主機</th>
            <th className="px-3 py-2 font-medium">來源資料庫名稱</th>
            <th className="px-3 py-2 font-medium">物件類型</th>
            <th className="px-3 py-2 font-medium">來源物件名稱</th>
            <th className="px-3 py-2 font-medium">資料表說明</th>
            <th className="px-3 py-2 font-medium">其他說明</th>
          </tr>
        </thead>
        <tbody>
          {results.map((row) => (
            <tr
              key={row.headerId}
              onDoubleClick={() => loadHeader(row.headerId)}
              className="cursor-pointer border-b border-gray-100 hover:bg-blue-50"
              title="雙擊載入至表頭／表身維護頁籤"
            >
              <td className="px-3 py-2">{row.databaseHost}</td>
              <td className="px-3 py-2">{row.databaseName}</td>
              <td className="px-3 py-2">{row.objectType}</td>
              <td className="px-3 py-2">
                <button
                  type="button"
                  onClick={() => loadHeader(row.headerId)}
                  className="text-blue-600 underline hover:text-blue-800"
                >
                  {row.objectName}
                </button>
              </td>
              <td className="px-3 py-2 text-gray-600">{row.tableDescription}</td>
              <td className="px-3 py-2 text-gray-600">{row.otherDescription}</td>
            </tr>
          ))}
          {results.length === 0 && (
            <tr>
              <td colSpan={6} className="px-3 py-8 text-center text-gray-400">
                {isSearching ? '查詢中…' : '請於上方輸入篩選條件後按「查詢」，或直接查詢顯示全部資料'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
