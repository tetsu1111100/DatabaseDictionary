import { useEffect, useState } from 'react';
import { Modal } from '../shared/Modal';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { ApiError, programUsageApi } from '../../api/client';
import type { ProgramUsageDto } from '../../types/dtos';

interface ProgramUsageModalProps {
  headerId: number;
  onClose: () => void;
}

interface Row extends ProgramUsageDto {
  clientKey: string;
}

function toRows(items: ProgramUsageDto[]): Row[] {
  return items.map((item) => ({ ...item, clientKey: crypto.randomUUID() }));
}

export function ProgramUsageModal({ headerId, onClose }: ProgramUsageModalProps) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingDeleteKey, setPendingDeleteKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    programUsageApi
      .getAll(headerId)
      .then((items) => {
        if (!cancelled) setRows(toRows(items));
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : '載入程式使用清單失敗。');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [headerId]);

  const addRow = () => {
    setRows((prev) => [...prev, { clientKey: crypto.randomUUID(), seqNo: 0, programName: '', description: '' }]);
  };

  const patchRow = (clientKey: string, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r) => (r.clientKey === clientKey ? { ...r, ...patch } : r)));
  };

  const confirmDelete = () => {
    if (!pendingDeleteKey) return;
    setRows((prev) => prev.filter((r) => r.clientKey !== pendingDeleteKey));
    setPendingDeleteKey(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload: ProgramUsageDto[] = rows.map(({ seqNo, programName, description }) => ({
        seqNo,
        programName,
        description,
      }));
      const saved = await programUsageApi.replaceAll(headerId, payload);
      setRows(toRows(saved));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '儲存程式使用清單失敗。');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="程式使用清單" onClose={onClose} widthClassName="max-w-2xl">
      {loading ? (
        <p className="text-sm text-gray-500">載入中…</p>
      ) : (
        <>
          {error && <p className="mb-2 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-300 bg-gray-100 text-left text-gray-600">
                <th className="px-2 py-2 font-medium">程式</th>
                <th className="px-2 py-2 font-medium">說明</th>
                <th className="w-12 px-2 py-2 font-medium">刪除</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.clientKey} className="border-b border-gray-100">
                  <td className="px-2 py-1">
                    <input
                      value={row.programName}
                      onChange={(e) => patchRow(row.clientKey, { programName: e.target.value })}
                      className="input w-full"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      value={row.description ?? ''}
                      onChange={(e) => patchRow(row.clientKey, { description: e.target.value })}
                      className="input w-full"
                    />
                  </td>
                  <td className="px-2 py-1 text-center">
                    <button
                      type="button"
                      onClick={() => setPendingDeleteKey(row.clientKey)}
                      className="text-gray-400 hover:text-red-600"
                      aria-label="刪除此列"
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-2 py-6 text-center text-gray-400">
                    尚無資料
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={addRow}
              className="rounded bg-gray-700 px-3 py-1 text-xs text-white hover:bg-gray-800"
            >
              + 新增列
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                關閉
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? '儲存中…' : '存檔'}
              </button>
            </div>
          </div>
        </>
      )}

      {pendingDeleteKey && (
        <ConfirmDialog
          title="刪除程式使用清單列"
          message="確定要刪除這筆資料嗎？需按下本視窗的「存檔」才會真正寫入資料庫。"
          danger
          confirmLabel="刪除"
          onConfirm={confirmDelete}
          onCancel={() => setPendingDeleteKey(null)}
        />
      )}
    </Modal>
  );
}
