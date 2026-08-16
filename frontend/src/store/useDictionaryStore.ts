import { create } from 'zustand';
import { headersApi } from '../api/client';
import type { ColumnDto, HeaderDetailDto, HeaderListItemDto, HeaderSearchQuery } from '../types/dtos';

export interface EditableColumn extends ColumnDto {
  clientKey: string;
  /** Transient UI-only marker from the "compare actual database" flow — never sent to the backend, cleared on save. */
  marker?: 'added' | 'removed';
}

export interface EditableHeader extends Omit<HeaderDetailDto, 'columns'> {
  columns: EditableColumn[];
}

export function blankColumn(sequence: number): EditableColumn {
  return {
    clientKey: crypto.randomUUID(),
    columnId: 0,
    sequence,
    columnName: '',
    columnDescription: '',
    dataType: '',
    isNullable: true,
    defaultValue: '',
    isPrimaryKey: false,
    isIdentity: false,
    paramDirection: 'IN',
    remark: '',
  };
}

export function blankHeader(): EditableHeader {
  return {
    headerId: 0,
    databaseName: '',
    databaseHost: '',
    objectType: 'Table',
    objectName: '',
    tableDescription: '',
    otherDescription: '',
    remark: '',
    connPort: '',
    connAccount: '',
    connPassword: '',
    useWindowsAuth: false,
    columns: [],
  };
}

function toEditable(dto: HeaderDetailDto): EditableHeader {
  return {
    ...dto,
    columns: dto.columns
      .slice()
      .sort((a, b) => a.sequence - b.sequence)
      .map((c) => ({ ...c, clientKey: crypto.randomUUID() })),
  };
}

interface DictionaryState {
  activeTab: 1 | 2;
  setActiveTab: (tab: 1 | 2) => void;

  searchFilters: HeaderSearchQuery;
  setSearchFilters: (filters: HeaderSearchQuery) => void;
  searchResults: HeaderListItemDto[];
  isSearching: boolean;
  runSearch: () => Promise<void>;

  currentHeader: EditableHeader;
  isNewHeader: boolean;

  loadHeader: (id: number) => Promise<void>;
  startNewHeader: () => void;
  setCurrentHeader: (updater: (h: EditableHeader) => EditableHeader) => void;
}

export const useDictionaryStore = create<DictionaryState>((set, get) => ({
  activeTab: 1,
  setActiveTab: (tab) => set({ activeTab: tab }),

  searchFilters: {},
  setSearchFilters: (filters) => set({ searchFilters: filters }),
  searchResults: [],
  isSearching: false,
  runSearch: async () => {
    set({ isSearching: true });
    try {
      const results = await headersApi.search(get().searchFilters);
      set({ searchResults: results });
    } finally {
      set({ isSearching: false });
    }
  },

  currentHeader: blankHeader(),
  isNewHeader: true,

  loadHeader: async (id) => {
    const dto = await headersApi.getById(id);
    set({ currentHeader: toEditable(dto), isNewHeader: false, activeTab: 1 });
  },

  startNewHeader: () => {
    set({ currentHeader: blankHeader(), isNewHeader: true, activeTab: 1 });
  },

  setCurrentHeader: (updater) => {
    set((state) => ({ currentHeader: updater(state.currentHeader) }));
  },
}));
