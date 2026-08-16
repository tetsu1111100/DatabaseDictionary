import type { ActualColumnDto } from '../../types/dtos';
import { blankColumn, type EditableColumn } from '../../store/useDictionaryStore';

/**
 * Merges a live schema-compare result into the currently-displayed column grid.
 * - Matched columns: structural fields (type/nullable/PK/identity/sequence/default) are overwritten from the
 *   actual database; user-entered ColumnDescription/Remark are kept untouched.
 * - Columns only in the actual database: appended and marked 'added' (rendered green).
 * - Columns only in the current grid: kept but marked 'removed' (rendered red/strikethrough) for the user to
 *   confirm removal manually — nothing is deleted automatically.
 * Purely a UI-state transform; nothing here touches the backend.
 */
export function mergeCompareResult(current: EditableColumn[], actual: ActualColumnDto[]): EditableColumn[] {
  const actualByName = new Map(actual.map((a) => [a.columnName.toLowerCase(), a]));
  const currentByName = new Map(current.map((c) => [c.columnName.toLowerCase(), c]));

  const merged: EditableColumn[] = current.map((c) => {
    const match = actualByName.get(c.columnName.toLowerCase());
    if (!match) {
      return { ...c, marker: 'removed' };
    }
    return {
      ...c,
      sequence: match.sequence,
      dataType: match.dataType,
      isNullable: match.isNullable,
      isPrimaryKey: match.isPrimaryKey,
      isIdentity: match.isIdentity,
      defaultValue: match.defaultValue,
      marker: undefined,
    };
  });

  for (const a of actual) {
    if (!currentByName.has(a.columnName.toLowerCase())) {
      merged.push({
        ...blankColumn(a.sequence),
        columnName: a.columnName,
        dataType: a.dataType,
        isNullable: a.isNullable,
        isPrimaryKey: a.isPrimaryKey,
        isIdentity: a.isIdentity,
        defaultValue: a.defaultValue,
        marker: 'added',
      });
    }
  }

  return merged;
}
