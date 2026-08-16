import { useState } from 'react';
import { Modal } from '../shared/Modal';

interface SqlPreviewModalProps {
  title: string;
  sql: string;
  onClose: () => void;
}

export function SqlPreviewModal({ title, sql, onClose }: SqlPreviewModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable — user can still select-all manually.
    }
  };

  return (
    <Modal title={title} onClose={onClose} widthClassName="max-w-3xl">
      <textarea
        readOnly
        value={sql}
        onFocus={(e) => e.currentTarget.select()}
        className="h-72 w-full resize-none rounded border border-gray-300 bg-gray-50 p-3 font-mono text-sm text-gray-800"
      />
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
        >
          {copied ? '已複製' : '複製'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          關閉
        </button>
      </div>
    </Modal>
  );
}
