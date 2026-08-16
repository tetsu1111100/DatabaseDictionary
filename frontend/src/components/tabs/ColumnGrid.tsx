import { useState } from 'react';
import { sqlApi, ApiError } from '../../api/client';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import type { EditableColumn } from '../../store/useDictionaryStore';

const DATA_TYPE_PRESETS: Array<[label: string, sample: string]> = [
  ['int', 'int'],
  ['bigint', 'bigint'],
  ['smallint', 'smallint'],
  ['tinyint', 'tinyint'],
  ['bit', 'bit'],
  ['decimal', 'decimal(13,4)'],
  ['numeric', 'numeric(13,4)'],
  ['float', 'float'],
  ['varchar', 'varchar(50)'],
  ['nvarchar', 'nvarchar(50)'],
  ['nvarchar(max)', 'nvarchar(max)'],
  ['char', 'char(10)'],
  ['nchar', 'nchar(10)'],
  ['text', 'text'],
  ['datetime', 'datetime'],
  ['datetime2', 'datetime2'],
  ['date', 'date'],
  ['time', 'time'],
  ['uniqueidentifier', 'uniqueidentifier'],
  ['varbinary(max)', 'varbinary(max)'],
  ['money', 'money'],
];

interface ColumnGridProps {
  objectType: string;
  objectName: string;
  columns: EditableColumn[];
  onChange: (columns: EditableColumn[]) => void;
  onAddRow: () => void;
  onShowSql: (title: string, sql: string) => void;
  onError: (message: string) => void;
}

export function ColumnGrid({ objectType, objectName, columns, onChange, onAddRow, onShowSql, onError }: ColumnGridProps) {
  const [pendingDeleteKey, setPendingDeleteKey] = useState<string | null>(null);

  const isTableOrView = objectType === 'Table' || objectType === 'View';
  const isFunctionOrProc = objectType === 'Function' || objectType === 'StoredProcedure';
  const isTable = objectType === 'Table';

  const sorted = [...columns].sort((a, b) => a.sequence - b.sequence);

  const patchColumn = (clientKey: string, patch: Partial<EditableColumn>) => {
    onChange(columns.map((c) => (c.clientKey === clientKey ? { ...c, ...patch } : c)));
  };

  const handleSequenceBlur = () => {
    const renumbered = sorted.map((c, idx) => ({ ...c, sequence: idx + 1 }));
    onChange(renumbered);
  };

  const confirmDelete = () => {
    if (!pendingDeleteKey) return;
    onChange(columns.filter((c) => c.clientKey !== pendingDeleteKey));
    setPendingDeleteKey(null);
  };

  const runSqlAction = async (kind: 'add' | 'drop' | 'alter', column: EditableColumn) => {
    if (!objectName.trim()) {
      onError('請先輸入來源物件名稱，才能產生 SQL。');
      return;
    }
    if (!column.columnName.trim()) {
      onError('請先輸入欄位名稱，才能產生 SQL。');
      return;
    }
    const request = { objectName, column };
    const titles: Record<typeof kind, string> = {
      add: '新增欄位 SQL',
      drop: '刪除欄位 SQL',
      alter: '修改欄位 SQL',
    };
    try {
      const fn = kind === 'add' ? sqlApi.addColumn : kind === 'drop' ? sqlApi.dropColumn : sqlApi.alterColumn;
      const result = await fn(request);
      onShowSql(titles[kind], result.sql);
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'SQL 產生失敗。');
    }
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">表身明細</h3>
        <button
          type="button"
          onClick={onAddRow}
          className="rounded bg-gray-700 px-3 py-1 text-xs text-white hover:bg-gray-800"
        >
          + 新增欄位列
        </button>
      </div>

      <div className="overflow-x-auto rounded border border-gray-200">
        <table className="w-full min-w-[1100px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-300 bg-gray-100 text-left text-gray-600">
              <th className="w-16 px-2 py-2 font-medium">順序</th>
              <th className="w-36 px-2 py-2 font-medium">欄位名稱</th>
              <th className="w-40 px-2 py-2 font-medium">欄位說明</th>
              <th className="w-56 px-2 py-2 font-medium">欄位型態</th>
              <th className="w-16 px-2 py-2 font-medium">允許NULL</th>
              <th className="w-28 px-2 py-2 font-medium">預設值</th>
              {isTableOrView && <th className="w-14 px-2 py-2 font-medium">PK</th>}
              {isTableOrView && <th className="w-16 px-2 py-2 font-medium">自動遞增</th>}
              {isFunctionOrProc && <th className="w-20 px-2 py-2 font-medium">參數方向</th>}
              <th className="w-32 px-2 py-2 font-medium">備註</th>
              {isTable && <th className="w-64 px-2 py-2 font-medium">SQL 產生</th>}
              <th className="w-16 px-2 py-2 font-medium">刪除</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((col) => (
              <tr
                key={col.clientKey}
                className={
                  col.marker === 'added'
                    ? 'bg-green-50'
                    : col.marker === 'removed'
                      ? 'bg-red-50 text-red-500 line-through decoration-red-400'
                      : 'border-b border-gray-100'
                }
              >
                <td className="px-2 py-1">
                  <input
                    type="number"
                    value={col.sequence}
                    onChange={(e) => patchColumn(col.clientKey, { sequence: Number(e.target.value) || 0 })}
                    onBlur={handleSequenceBlur}
                    className="w-14 rounded border border-gray-300 px-1 py-0.5"
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    value={col.columnName}
                    onChange={(e) => patchColumn(col.clientKey, { columnName: e.target.value })}
                    className="w-32 rounded border border-gray-300 px-1 py-0.5"
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    value={col.columnDescription ?? ''}
                    onChange={(e) => patchColumn(col.clientKey, { columnDescription: e.target.value })}
                    className="w-36 rounded border border-gray-300 px-1 py-0.5"
                  />
                </td>
                <td className="px-2 py-1">
                  <div className="flex gap-1">
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        const preset = e.target.value;
                        if (preset) patchColumn(col.clientKey, { dataType: preset });
                        e.target.value = '';
                      }}
                      className="rounded border border-gray-300 px-1 py-0.5 text-xs"
                    >
                      <option value="" disabled>
                        套用常用型態…
                      </option>
                      {DATA_TYPE_PRESETS.map(([label, sample]) => (
                        <option key={label} value={sample}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <input
                      value={col.dataType}
                      onChange={(e) => patchColumn(col.clientKey, { dataType: e.target.value })}
                      placeholder="例如 decimal(13,2)"
                      className="w-32 rounded border border-gray-300 px-1 py-0.5"
                    />
                  </div>
                </td>
                <td className="px-2 py-1 text-center">
                  <input
                    type="checkbox"
                    checked={col.isNullable}
                    onChange={(e) => patchColumn(col.clientKey, { isNullable: e.target.checked })}
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    value={col.defaultValue ?? ''}
                    onChange={(e) => patchColumn(col.clientKey, { defaultValue: e.target.value })}
                    className="w-24 rounded border border-gray-300 px-1 py-0.5"
                  />
                </td>
                {isTableOrView && (
                  <td className="px-2 py-1 text-center">
                    <input
                      type="checkbox"
                      checked={col.isPrimaryKey}
                      onChange={(e) => patchColumn(col.clientKey, { isPrimaryKey: e.target.checked })}
                    />
                  </td>
                )}
                {isTableOrView && (
                  <td className="px-2 py-1 text-center">
                    <input
                      type="checkbox"
                      checked={col.isIdentity}
                      onChange={(e) => patchColumn(col.clientKey, { isIdentity: e.target.checked })}
                    />
                  </td>
                )}
                {isFunctionOrProc && (
                  <td className="px-2 py-1">
                    <select
                      value={col.paramDirection ?? 'IN'}
                      onChange={(e) => patchColumn(col.clientKey, { paramDirection: e.target.value as 'IN' | 'OUT' })}
                      className="rounded border border-gray-300 px-1 py-0.5"
                    >
                      <option value="IN">IN</option>
                      <option value="OUT">OUT</option>
                    </select>
                  </td>
                )}
                <td className="px-2 py-1">
                  <input
                    value={col.remark ?? ''}
                    onChange={(e) => patchColumn(col.clientKey, { remark: e.target.value })}
                    className="w-28 rounded border border-gray-300 px-1 py-0.5"
                  />
                </td>
                {isTable && (
                  <td className="px-2 py-1">
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => runSqlAction('add', col)}
                        className="rounded bg-emerald-600 px-2 py-0.5 text-xs text-white hover:bg-emerald-700"
                      >
                        新增SQL
                      </button>
                      <button
                        type="button"
                        onClick={() => runSqlAction('alter', col)}
                        className="rounded bg-amber-600 px-2 py-0.5 text-xs text-white hover:bg-amber-700"
                      >
                        修改SQL
                      </button>
                      <button
                        type="button"
                        onClick={() => runSqlAction('drop', col)}
                        className="rounded bg-red-600 px-2 py-0.5 text-xs text-white hover:bg-red-700"
                      >
                        刪除SQL
                      </button>
                    </div>
                  </td>
                )}
                <td className="px-2 py-1 text-center">
                  <button
                    type="button"
                    onClick={() => setPendingDeleteKey(col.clientKey)}
                    className="text-gray-400 hover:text-red-600"
                    aria-label="刪除此列"
                  >
                    🗑
                  </button>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={12} className="px-3 py-6 text-center text-gray-400">
                  尚無欄位，請按「新增欄位列」開始建立
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pendingDeleteKey && (
        <ConfirmDialog
          title="刪除表身列"
          message="確定要刪除此欄位列嗎？此動作在按下「存檔」前僅為畫面暫存，但仍請確認。"
          danger
          confirmLabel="刪除"
          onConfirm={confirmDelete}
          onCancel={() => setPendingDeleteKey(null)}
        />
      )}
    </div>
  );
}
