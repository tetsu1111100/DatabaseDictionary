import { useState } from 'react';
import { blankColumn, useDictionaryStore } from '../../store/useDictionaryStore';
import { ApiError, headersApi, schemaApi, sqlApi } from '../../api/client';
import { HeaderForm } from './HeaderForm';
import { ColumnGrid } from './ColumnGrid';
import { SqlPreviewModal } from './SqlPreviewModal';
import { ProgramUsageModal } from './ProgramUsageModal';
import { CompareCredentialsModal } from './CompareCredentialsModal';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { mergeCompareResult } from './compareDiff';

export function HeaderDetailTab() {
  const currentHeader = useDictionaryStore((s) => s.currentHeader);
  const isNewHeader = useDictionaryStore((s) => s.isNewHeader);
  const setCurrentHeader = useDictionaryStore((s) => s.setCurrentHeader);
  const startNewHeader = useDictionaryStore((s) => s.startNewHeader);
  const loadHeader = useDictionaryStore((s) => s.loadHeader);
  const runSearch = useDictionaryStore((s) => s.runSearch);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showProgramUsage, setShowProgramUsage] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [sqlModal, setSqlModal] = useState<{ title: string; sql: string } | null>(null);

  const isTable = currentHeader.objectType === 'Table';

  const handlePatch = (patch: Partial<typeof currentHeader>) => {
    setCurrentHeader((h) => ({ ...h, ...patch }));
  };

  const handleAddRow = () => {
    const nextSeq = currentHeader.columns.length + 1;
    setCurrentHeader((h) => ({ ...h, columns: [...h.columns, blankColumn(nextSeq)] }));
  };

  const handleSave = async () => {
    setError(null);
    if (!currentHeader.databaseName.trim() || !currentHeader.databaseHost.trim() || !currentHeader.objectType.trim() || !currentHeader.objectName.trim()) {
      setError('來源資料庫名稱、資料庫主機、物件類型、來源物件名稱皆為必填。');
      return;
    }
    setSaving(true);
    try {
      if (isNewHeader) {
        const created = await headersApi.create(currentHeader);
        await loadHeader(created.headerId);
      } else {
        await headersApi.update(currentHeader.headerId, currentHeader);
        await loadHeader(currentHeader.headerId);
      }
      await runSearch();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '存檔失敗。');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    setError(null);
    try {
      await headersApi.remove(currentHeader.headerId);
      startNewHeader();
      await runSearch();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '刪除失敗。');
    }
  };

  const handleGenerateCreateTable = async () => {
    setError(null);
    if (!currentHeader.objectName.trim()) {
      setError('請先輸入來源物件名稱。');
      return;
    }
    try {
      const result = await sqlApi.createTable({ objectName: currentHeader.objectName, columns: currentHeader.columns });
      setSqlModal({ title: 'CREATE TABLE SQL', sql: result.sql });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '產生 SQL 失敗。');
    }
  };

  const hasSavedCreds =
    currentHeader.useWindowsAuth || (!!currentHeader.connAccount && !!currentHeader.connPassword);

  const runCompare = async (creds: { connAccount: string; connPassword: string; useWindowsAuth: boolean }) => {
    setComparing(true);
    setError(null);
    try {
      const result = await schemaApi.compare({
        databaseHost: currentHeader.databaseHost,
        databaseName: currentHeader.databaseName,
        objectName: currentHeader.objectName,
        connPort: currentHeader.connPort,
        connAccount: creds.connAccount,
        connPassword: creds.connPassword,
        useWindowsAuth: creds.useWindowsAuth,
      });
      const merged = mergeCompareResult(currentHeader.columns, result.columns);
      setCurrentHeader((h) => ({ ...h, columns: merged }));
      setShowCompareModal(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '比對實際資料庫失敗。');
    } finally {
      setComparing(false);
    }
  };

  const handleCompareClick = () => {
    setError(null);
    if (!currentHeader.databaseHost.trim() || !currentHeader.databaseName.trim() || !currentHeader.objectName.trim()) {
      setError('請先填寫資料庫主機、來源資料庫名稱、來源物件名稱後再比對。');
      return;
    }
    if (hasSavedCreds) {
      runCompare({
        connAccount: currentHeader.connAccount ?? '',
        connPassword: currentHeader.connPassword ?? '',
        useWindowsAuth: currentHeader.useWindowsAuth,
      });
    } else {
      setShowCompareModal(true);
    }
  };

  return (
    <div className="p-4">
      {error && <p className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="mb-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => { startNewHeader(); setError(null); }} className="btn-secondary">
          新增
        </button>
        <button type="button" onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? '儲存中…' : '存檔'}
        </button>
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={isNewHeader}
          className="btn-danger disabled:opacity-40"
        >
          刪除
        </button>
        {isTable && (
          <button type="button" onClick={handleGenerateCreateTable} className="btn-secondary">
            產生 CREATE TABLE SQL
          </button>
        )}
        {isTable && (
          <button type="button" onClick={handleCompareClick} disabled={comparing} className="btn-secondary">
            {comparing ? '比對中…' : '比對實際資料庫差異'}
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowProgramUsage(true)}
          disabled={isNewHeader}
          title={isNewHeader ? '請先存檔後才能使用程式使用清單' : undefined}
          className="btn-secondary disabled:opacity-40"
        >
          程式使用清單
        </button>
      </div>

      <HeaderForm header={currentHeader} onPatch={handlePatch} />

      <div className="mt-6">
        <ColumnGrid
          objectType={currentHeader.objectType}
          objectName={currentHeader.objectName}
          columns={currentHeader.columns}
          onChange={(columns) => setCurrentHeader((h) => ({ ...h, columns }))}
          onAddRow={handleAddRow}
          onShowSql={(title, sql) => setSqlModal({ title, sql })}
          onError={setError}
        />
      </div>

      {sqlModal && (
        <SqlPreviewModal title={sqlModal.title} sql={sqlModal.sql} onClose={() => setSqlModal(null)} />
      )}

      {showProgramUsage && (
        <ProgramUsageModal headerId={currentHeader.headerId} onClose={() => setShowProgramUsage(false)} />
      )}

      {showCompareModal && (
        <CompareCredentialsModal
          submitting={comparing}
          onClose={() => setShowCompareModal(false)}
          onSubmit={runCompare}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmDialog
          title="刪除表頭"
          message={`確定要刪除「${currentHeader.objectName}」嗎？將一併刪除所有表身欄位與程式使用清單，此動作無法復原。`}
          danger
          confirmLabel="刪除"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}
