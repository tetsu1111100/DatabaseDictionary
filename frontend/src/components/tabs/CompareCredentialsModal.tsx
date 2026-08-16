import { useState } from 'react';
import { Modal } from '../shared/Modal';

interface CompareCredentialsModalProps {
  submitting: boolean;
  onClose: () => void;
  onSubmit: (creds: { connAccount: string; connPassword: string; useWindowsAuth: boolean }) => void;
}

/** One-off credential prompt for "compare actual database" — nothing entered here is ever persisted. */
export function CompareCredentialsModal({ submitting, onClose, onSubmit }: CompareCredentialsModalProps) {
  const [useWindowsAuth, setUseWindowsAuth] = useState(false);
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = () => {
    onSubmit({ connAccount: account, connPassword: password, useWindowsAuth });
  };

  return (
    <Modal title="輸入本次比對用連線帳密" onClose={onClose} widthClassName="max-w-sm">
      <p className="mb-3 text-xs text-gray-500">表頭未維護連線帳密，此處輸入僅供本次比對使用，不會寫入資料庫。</p>
      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={useWindowsAuth}
            onChange={(e) => setUseWindowsAuth(e.target.checked)}
          />
          使用 Windows 整合驗證
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs text-gray-500">帳號</span>
          <input
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            disabled={useWindowsAuth}
            className="input disabled:bg-gray-100 disabled:text-gray-400"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs text-gray-500">密碼</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={useWindowsAuth}
            className="input disabled:bg-gray-100 disabled:text-gray-400"
          />
        </label>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          取消
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? '比對中…' : '開始比對'}
        </button>
      </div>
    </Modal>
  );
}
