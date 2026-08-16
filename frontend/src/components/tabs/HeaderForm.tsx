import type { ReactNode } from 'react';
import { OBJECT_TYPES } from '../../types/dtos';
import type { EditableHeader } from '../../store/useDictionaryStore';

interface HeaderFormProps {
  header: EditableHeader;
  onPatch: (patch: Partial<EditableHeader>) => void;
}

export function HeaderForm({ header, onPatch }: HeaderFormProps) {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
      <Field label="來源資料庫名稱" required>
        <input
          value={header.databaseName}
          onChange={(e) => onPatch({ databaseName: e.target.value })}
          className="input"
        />
      </Field>
      <Field label="資料庫主機" required>
        <input
          value={header.databaseHost}
          onChange={(e) => onPatch({ databaseHost: e.target.value })}
          className="input"
        />
      </Field>
      <Field label="物件類型" required>
        <input
          list="object-type-options"
          value={header.objectType}
          onChange={(e) => onPatch({ objectType: e.target.value })}
          className="input"
        />
        <datalist id="object-type-options">
          {OBJECT_TYPES.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
      </Field>
      <Field label="來源物件名稱" required>
        <input
          value={header.objectName}
          onChange={(e) => onPatch({ objectName: e.target.value })}
          className="input"
        />
      </Field>
      <Field label="資料表說明">
        <input
          value={header.tableDescription ?? ''}
          onChange={(e) => onPatch({ tableDescription: e.target.value })}
          className="input"
        />
      </Field>
      <Field label="其他說明">
        <input
          value={header.otherDescription ?? ''}
          onChange={(e) => onPatch({ otherDescription: e.target.value })}
          className="input"
        />
      </Field>
      <Field label="備註">
        <input
          value={header.remark ?? ''}
          onChange={(e) => onPatch({ remark: e.target.value })}
          className="input"
        />
      </Field>

      <div className="col-span-full mt-2 border-t border-gray-200 pt-3">
        <p className="mb-2 text-xs font-medium text-gray-500">
          連線資訊（選填，僅供「比對實際資料庫差異」功能使用）
        </p>
        <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Port">
            <input
              value={header.connPort ?? ''}
              onChange={(e) => onPatch({ connPort: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="帳號">
            <input
              value={header.connAccount ?? ''}
              onChange={(e) => onPatch({ connAccount: e.target.value })}
              disabled={header.useWindowsAuth}
              className="input disabled:bg-gray-100 disabled:text-gray-400"
            />
          </Field>
          <Field label="密碼">
            <input
              type="password"
              value={header.connPassword ?? ''}
              onChange={(e) => onPatch({ connPassword: e.target.value })}
              disabled={header.useWindowsAuth}
              className="input disabled:bg-gray-100 disabled:text-gray-400"
            />
          </Field>
          <label className="flex items-center gap-2 pt-5 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={header.useWindowsAuth}
              onChange={(e) => onPatch({ useWindowsAuth: e.target.checked })}
            />
            使用 Windows 整合驗證
          </label>
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-xs text-gray-500">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}
