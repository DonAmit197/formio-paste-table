/** @format */

export type PasteTableValue = {
  headers: string[];
  rows: string[][];
} | null;

export type PasteTableRefs = {
  labelEl?: HTMLLabelElement;
  userInfoEl?: HTMLDivElement;
  infoMsg?: HTMLDivElement;
  errorMsg?: HTMLDivElement;
  tabulatorTarget?: HTMLDivElement;
  addRowBtn?: HTMLButtonElement;
  deleteRowBtn?: HTMLButtonElement;
  maxRowMsg?: HTMLDivElement;
  deleteHint?: HTMLDivElement;
};

export type PasteTableDataType = 'alphabet' | 'numeric' | 'alphanumeric' | 'email';

export type PasteTableHeaderSetting = {
  value?: string;
  maxChars?: number;
  dataType?: PasteTableDataType;
};

export type PasteTableColumnRule = {
  header: string;
  maxChars: number;
  dataType: PasteTableDataType;
};

export type PasteTableSchema = {
  label?: string;
  tableHeaders?: Array<PasteTableHeaderSetting | string>;
  maxRows?: number;
  customMessage?: string;
  userInformation?: string;
  validate?: {
    required?: boolean;
    [key: string]: any;
  };
  disabled?: boolean;
  [key: string]: any;
};

export type CellValidationResult = {
  isValid: boolean;
  message: string;
  severity: 'none' | 'business' | 'security';
};
