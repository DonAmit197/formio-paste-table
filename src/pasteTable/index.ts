/** @format */

import { Components } from 'formiojs';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator.min.css';

type PasteTableValue = {
  headers: string[];
  rows: string[][];
} | null;

type PasteTableRefs = {
  labelEl?: HTMLLabelElement;
  userInfoEl?: HTMLDivElement;
  infoMsg?: HTMLDivElement;
  errorMsg?: HTMLDivElement;
  tabulatorTarget?: HTMLDivElement;
};

type PasteTableDataType = 'alphabet' | 'numeric' | 'alphanumeric' | 'email';

type PasteTableHeaderSetting = {
  value?: string;
  maxChars?: number;
  dataType?: PasteTableDataType;
};

type PasteTableColumnRule = {
  header: string;
  maxChars: number;
  dataType: PasteTableDataType;
};

type PasteTableSchema = {
  label?: string;
  tableHeaders?: Array<PasteTableHeaderSetting | string>;
  maxRows?: number;
  customMessage?: string;
  userInformation?: string;
  validate?: {
    required?: boolean;
    [key: string]: any;
  };
  [key: string]: any;
};

const BaseComponent = Components.components.base;

interface BaseComponentInstance {
  component: PasteTableSchema;
  options?: Record<string, any>;
  triggerChange(): void;
  dataValue: unknown;
  loadRefs(element: HTMLElement, refs: Record<string, string>): void;
  render(template: string): string;
  attach(element: HTMLElement): Promise<void> | void;
  detach(): void;
}

export default class PasteTableComponent
  extends (BaseComponent as unknown as new (
    ...args: unknown[]
  ) => BaseComponentInstance)
  implements BaseComponentInstance
{
  declare refs: PasteTableRefs;

  private _table: Tabulator | null = null;
  private _tableValue: PasteTableValue = null;
  private _isMutatingTable = false;

  static schema(...extend: any[]) {
    return (BaseComponent.schema as any)(
      {
        type: 'pasteTable',
        label: 'Paste Table',
        key: 'pasteTable',
        input: true,
        tableHeaders: [],
        maxRows: 10,
        customMessage:
          'Please add at least one complete row and do not leave incomplete rows in the table.',
        userInformation: '',
        validate: {
          required: true,
        },
      },
      ...extend,
    );
  }

  static get builderInfo() {
    return {
      title: 'Paste Table',
      icon: 'table',
      group: 'basic',
      weight: 70,
      schema: PasteTableComponent.schema(),
    };
  }

  static editForm() {
    return {
      components: [
        {
          type: 'tabs',
          key: 'tabs',
          components: [
            {
              label: 'Display',
              key: 'display',
              components: [
                {
                  type: 'textfield',
                  key: 'label',
                  label: 'Label',
                  input: true,
                },
                {
                  type: 'textfield',
                  key: 'key',
                  label: 'Property Name',
                  input: true,
                },
                {
                  type: 'checkbox',
                  key: 'validate.required',
                  label: 'Required',
                  input: true,
                  defaultValue: true,
                },
                {
                  type: 'number',
                  key: 'maxRows',
                  label: 'Maximum number of Rows in the table',
                  input: true,
                  defaultValue: 10,
                  validate: {
                    min: 1,
                    integer: true,
                  },
                },
                {
                  type: 'textfield',
                  key: 'customMessage',
                  label: 'Custom error message',
                  input: true,
                  defaultValue:
                    'Please add at least one complete row and do not leave incomplete rows in the table.',
                },
                {
                  type: 'textarea',
                  key: 'userInformation',
                  label: 'User Information',
                  input: true,
                  rows: 3,
                },
                {
                  type: 'datagrid',
                  key: 'tableHeaders',
                  label: 'Table Column Headers',
                  input: true,
                  addAnother: 'Add Header',
                  components: [
                    {
                      type: 'textfield',
                      key: 'value',
                      label: 'Header Name',
                      input: true,
                    },
                    {
                      type: 'number',
                      key: 'maxChars',
                      label: 'Maximum characters allowed',
                      input: true,
                      defaultValue: 20,
                      validate: {
                        min: 1,
                        integer: true,
                      },
                    },
                    {
                      type: 'select',
                      key: 'dataType',
                      label: 'Data type allowed',
                      input: true,
                      defaultValue: 'alphabet',
                      dataSrc: 'values',
                      data: {
                        values: [
                          { label: 'Alphabet', value: 'alphabet' },
                          { label: 'Numeric', value: 'numeric' },
                          {
                            label: 'Alphabet and Numeric',
                            value: 'alphanumeric',
                          },
                          { label: 'Email', value: 'email' },
                        ],
                      },
                    },
                  ],
                },
              ],
            },
            {
              label: 'API',
              key: 'api',
              components: [
                {
                  type: 'checkbox',
                  key: 'input',
                  label: 'Input',
                  input: true,
                },
              ],
            },
          ],
        },
      ],
    };
  }

  /**
   * Detect builder/edit preview mode.
   * In this mode the grid remains read-only and does not emit runtime change behavior.
   */
  private isBuilderPreview(): boolean {
    return !!(
      (this as any).builderMode ||
      (this.options && this.options.builder)
    );
  }

  /**
   * Return max data rows configured by builder.
   */
  private getMaxRows(): number {
    const raw = Number(this.component.maxRows);
    if (!raw || raw < 1) {
      return 10;
    }
    return Math.floor(raw);
  }

  /**
   * Return configured validation message.
   */
  private getValidationMessage(): string {
    const msg = this.component.customMessage;
    if (msg && String(msg).trim()) {
      return String(msg).trim();
    }

    return 'Please add at least one complete row and do not leave incomplete rows in the table.';
  }

  /**
   * Optional builder-provided user information shown under label.
   */
  private getUserInformation(): string {
    const info = this.component.userInformation;
    return info && String(info).trim() ? String(info).trim() : '';
  }

  /**
   * Standard helper text shown above table.
   */
  private getInfoMessage(): string {
    return `Paste spreadsheet rows directly into the table below. The copied first row will be treated as headers and skipped automatically. Maximum allowed data rows: ${this.getMaxRows()}. Incomplete rows are not allowed.`;
  }

  /**
   * Normalize column rules from builder settings.
   */
  private getConfiguredColumnRules(): PasteTableColumnRule[] {
    return (this.component.tableHeaders || [])
      .map((item) => {
        if (typeof item === 'string') {
          const header = item.trim();
          if (!header) return null;

          return {
            header,
            maxChars: 20,
            dataType: 'alphabet' as PasteTableDataType,
          };
        }

        if (!item || !item.value || !String(item.value).trim()) {
          return null;
        }

        const rawMaxChars = Number(item.maxChars);
        const maxChars =
          rawMaxChars && rawMaxChars > 0 ? Math.floor(rawMaxChars) : 20;

        // const dataType = this.isValidDataType(item.dataType)
        //   ? item.dataType
        //   : 'alphabet';
        const normalizedDataType = String(item.dataType || '')
          .trim()
          .toLowerCase();

        const dataType = this.isValidDataType(normalizedDataType)
          ? normalizedDataType
          : 'alphabet';

        return {
          header: String(item.value).trim(),
          maxChars,
          dataType,
        };
      })
      .filter(Boolean) as PasteTableColumnRule[];
  }

  /**
   * Return header titles only for submission payload.
   */
  // private getConfiguredHeaders(): string[] {
  //   return this.getConfiguredColumnRules().map((rule) => rule.header);
  // }

  /**
   * Check if a provided value is a supported data type.
   */
  private isValidDataType(value: any): value is PasteTableDataType {
    return (
      value === 'alphabet' ||
      value === 'numeric' ||
      value === 'alphanumeric' ||
      value === 'email'
    );
  }

  /**
   * Render label + optional user info + helper text + error + table target.
   */
  render() {
    const labelText = this.component.label ? String(this.component.label) : '';
    const isRequired = !!(
      this.component.validate && this.component.validate.required
    );
    const userInformation = this.getUserInformation();

    return super.render(`
      <div class="paste-table-root">
        ${
          labelText
            ? `<label class="control-label paste-table-label" ref="labelEl">
                ${labelText}${isRequired ? ' <span class="field-required">*</span>' : ''}
              </label>`
            : ''
        }

        ${
          userInformation
            ? `<div class="paste-table-userinfo" ref="userInfoEl">${userInformation}</div>`
            : ''
        }

        <div class="paste-table-info" ref="infoMsg">
          ${this.getInfoMessage()}
        </div>

        <div class="paste-error text-danger" ref="errorMsg" style="display:none;"></div>

        <div class="paste-table-wrap">
          <div ref="tabulatorTarget"></div>
        </div>
      </div>
    `);
  }

  /**
   * Attach refs, listeners and initialize grid.
   */
  attach(element: HTMLElement) {
    const attached = super.attach(element);

    this.loadRefs(element, {
      labelEl: 'single',
      userInfoEl: 'single',
      infoMsg: 'single',
      errorMsg: 'single',
      tabulatorTarget: 'single',
    });

    if (!this.isBuilderPreview()) {
      this.refs.tabulatorTarget?.addEventListener(
        'paste',
        this.handleNativePaste,
      );
    }

    this.initTableFromConfiguredHeaders();

    return attached;
  }

  /**
   * Cleanup listeners and table instance.
   */
  detach() {
    this.refs.tabulatorTarget?.removeEventListener(
      'paste',
      this.handleNativePaste,
    );

    if (this._table) {
      this._table.destroy();
      this._table = null;
    }

    return super.detach();
  }

  /**
   * Form.io empty-state check.
   */
  isEmpty(value: PasteTableValue) {
    const enteredRows = this.getEnteredRowsFromValue(value);
    const completeRows = enteredRows.filter((row) =>
      this.isCompleteRowArray(row),
    );

    return completeRows.length === 0;
  }

  /**
   * Hook into Form.io validation lifecycle.
   */
  checkValidity(
    data: any,
    dirty: boolean,
    rowData?: any,
    options?: any,
    silentCheck?: boolean,
  ) {
    const superValid = (BaseComponent.prototype as any).checkValidity.call(
      this,
      data,
      dirty,
      rowData,
      options,
      silentCheck,
    );

    const value = this.getValue();
    const message = this.getComponentValidationMessage(value);

    if ((this as any).setCustomValidity) {
      (this as any).setCustomValidity(message || '', dirty);
    }

    if (!silentCheck) {
      if (message) {
        this.showError(message);
      } else {
        this.hideError();
      }
    }

    return superValid && !message;
  }

  /**
   * Component-specific validation message.
   */
  private getComponentValidationMessage(value: PasteTableValue): string {
    const required = !!(
      this.component.validate && this.component.validate.required
    );

    const enteredRows = this.getEnteredRowsFromValue(value);
    const hasAtLeastOneCompleteRow = enteredRows.some((row) =>
      this.isCompleteRowArray(row),
    );
    const hasIncompleteRows = enteredRows.some((row) =>
      this.isPartiallyFilledRowArray(row),
    );

    if (required && !hasAtLeastOneCompleteRow) {
      return this.getValidationMessage();
    }

    if (hasIncompleteRows) {
      return this.getValidationMessage();
    }

    return '';
  }

  /**
   * Extract entered rows from current stored value.
   */
  private getEnteredRowsFromValue(value: PasteTableValue): string[][] {
    if (!value || !Array.isArray(value.rows)) {
      return [];
    }

    return value.rows
      .map((row) => {
        if (!Array.isArray(row)) return [];
        return row.map((cell) => {
          return cell == null ? '' : String(cell);
        });
      })
      .filter((row) => row.some((cell) => String(cell).trim() !== ''));
  }

  /**
   * True when every cell in row has a non-empty value.
   */
  private isCompleteRowArray(row: string[]): boolean {
    if (!row.length) return false;

    let i = 0;
    for (i = 0; i < row.length; i += 1) {
      if (String(row[i] || '').trim() === '') {
        return false;
      }
    }

    return true;
  }

  /**
   * True when row has some values but not all.
   */
  private isPartiallyFilledRowArray(row: string[]): boolean {
    const hasAny = row.some((cell) => String(cell || '').trim() !== '');
    const hasAnyEmpty = row.some((cell) => String(cell || '').trim() === '');

    return hasAny && hasAnyEmpty;
  }

  /**
   * Create one blank row object aligned to headers.
   */
  private createBlankRow(headers: string[]): Record<string, string> {
    const row: Record<string, string> = {};

    headers.forEach((header) => {
      row[header] = '';
    });

    return row;
  }

  /**
   * Parse clipboard text into 2D row array.
   */
  private parseClipboard(text: string): string[][] {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n')
      .filter((line) => line.trim() !== '')
      .map((line) => line.split('\t').map((cell) => cell.trim()));
  }

  /**
   * Normalize table row object into string array aligned to headers.
   */
  private mapRowObjectToArray(
    rowObj: Record<string, any>,
    headers: string[],
  ): string[] {
    return headers.map((header) => {
      const value = rowObj[header];
      return value == null ? '' : String(value);
    });
  }

  /**
   * Normalize row array into object aligned to headers.
   */
  private mapRowArrayToObject(
    row: string[],
    headers: string[],
  ): Record<string, string> {
    const record: Record<string, string> = {};

    headers.forEach((header, index) => {
      record[header] = row[index] ?? '';
    });

    return record;
  }

  /**
   * Internal setter to avoid unnecessary change firing in builder preview.
   */
  private setStoredValue(value: PasteTableValue, emitChange: boolean) {
    this._tableValue = value;
    this.dataValue = value;

    if (emitChange) {
      this.triggerChange();
    }
  }

  /**
   * Persist current table rows into submission shape.
   */
  private syncValueFromTable(headers: string[]) {
    if (!this._table) return;

    const tableData = this._table.getData() as Record<string, any>[];

    const rows = tableData
      .map((rowObj) => this.mapRowObjectToArray(rowObj, headers))
      .filter((row) => row.some((cell) => String(cell).trim() !== ''));

    this.setStoredValue(
      {
        headers,
        rows,
      },
      !this.isBuilderPreview(),
    );
  }

  /**
   * Ensure table keeps only entered rows, respects max rows,
   * and adds one blank row at bottom while space remains.
   */
  private normalizeTableRows(headers: string[]) {
    if (!this._table) return;

    const maxRows = this.getMaxRows();
    const currentRows = this._table.getData() as Record<string, any>[];

    const enteredRows = currentRows
      .map((rowObj) => this.mapRowObjectToArray(rowObj, headers))
      .filter((row) => row.some((cell) => String(cell).trim() !== ''))
      .slice(0, maxRows);

    const nextRows = enteredRows.map((row) =>
      this.mapRowArrayToObject(row, headers),
    );

    if (enteredRows.length < maxRows) {
      nextRows.push(this.createBlankRow(headers));
    }

    this._isMutatingTable = true;
    this._table.setData(nextRows).finally(() => {
      this._isMutatingTable = false;
      this.syncValueFromTable(headers);
    });
  }

  /**
   * Validate a single cell value against suspicious content, length and data type.
   * Empty values are allowed here and handled later by required/incomplete-row validation.
   */
  private validateCellValue(
    value: string,
    rule: PasteTableColumnRule,
    mode: 'paste' | 'manual',
  ): { isValid: boolean; message: string } {
    const trimmedValue = value == null ? '' : String(value);

    if (trimmedValue === '') {
      return { isValid: true, message: '' };
    }

    if (this.containsUnsafePattern(trimmedValue)) {
      return {
        isValid: false,
        message:
          mode === 'paste'
            ? `The pasted value for "${rule.header}" contains unsafe content and was rejected.`
            : `The entered value for "${rule.header}" contains unsafe content and was rejected.`,
      };
    }

    if (trimmedValue.length > rule.maxChars) {
      return {
        isValid: false,
        message:
          mode === 'paste'
            ? `The pasted value for "${rule.header}" exceeds the maximum of ${rule.maxChars} characters.`
            : `The entered value for "${rule.header}" exceeds the maximum of ${rule.maxChars} characters.`,
      };
    }

    if (!this.matchesDataType(trimmedValue, rule.dataType)) {
      return {
        isValid: false,
        message:
          mode === 'paste'
            ? `The pasted value for "${rule.header}" does not match the allowed data type (${this.getDataTypeLabel(rule.dataType)}).`
            : `The entered value for "${rule.header}" does not match the allowed data type (${this.getDataTypeLabel(rule.dataType)}).`,
      };
    }

    return { isValid: true, message: '' };
  }

  /**
   * Basic unsafe-content detection for plain-text cell input.
   * This is a practical first-pass rejection, not full OWASP coverage.
   */
  private containsUnsafePattern(value: string): boolean {
    return /<|>|javascript:|vbscript:|data:text\/html|on\w+\s*=|<script|<img|<svg|<iframe|&lt;|&gt;/i.test(
      value,
    );
  }

  /**
   * Human-readable data type label.
   */
  private getDataTypeLabel(dataType: PasteTableDataType): string {
    if (dataType === 'alphabet') return 'Alphabet';
    if (dataType === 'numeric') return 'Numeric';
    if (dataType === 'alphanumeric') return 'Alphabet and Numeric';
    return 'Email';
  }

  /**
   * Data type matcher.
   */
  private matchesDataType(
    value: string,
    dataType: PasteTableDataType,
  ): boolean {
    const alphabetRegex = /^[A-Za-z\s'-]+$/;
    const numericRegex = /^\d+(\.\d{1,2})?$/;
    const alphaNumericRegex = /^[A-Za-z0-9\s'-]+$/;
    const emailRegex = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

    if (dataType === 'alphabet') {
      return alphabetRegex.test(value);
    }

    if (dataType === 'numeric') {
      return numericRegex.test(value);
    }

    if (dataType === 'alphanumeric') {
      return alphaNumericRegex.test(value);
    }

    return emailRegex.test(value);
  }

  /**
   * Find column rule by header field.
   */
  private getRuleByHeader(
    header: string,
    rules: PasteTableColumnRule[],
  ): PasteTableColumnRule | null {
    let i = 0;

    for (i = 0; i < rules.length; i += 1) {
      if (rules[i].header === header) {
        return rules[i];
      }
    }

    return null;
  }

  /**
   * Custom input editor used for runtime editing.
   * Invalid manual edits are rejected and previous value is restored.
   */
  private createInputEditor(
    cell: any,
    onRendered: any,
    success: any,
    cancel: any,
    rules: PasteTableColumnRule[],
  ) {
    const input = document.createElement('input');
    const currentValue = cell.getValue() == null ? '' : String(cell.getValue());
    const field = String(cell.getField() || '');
    const rule = this.getRuleByHeader(field, rules);

    input.setAttribute('type', 'text');
    input.value = currentValue;
    input.style.padding = '4px';
    input.style.width = '100%';
    input.style.height = '100%';
    input.style.boxSizing = 'border-box';
    input.style.border = 'none';
    input.style.outline = 'none';
    input.style.background = 'transparent';

    onRendered(function () {
      input.focus();
    });

    input.addEventListener('mousedown', function (e) {
      e.stopPropagation();
    });

    input.addEventListener('click', function (e) {
      e.stopPropagation();
    });

    const self = this;

    function onChange() {
      const nextValue = input.value;

      if (nextValue === currentValue) {
        cancel();
        return;
      }

      if (rule) {
        const validation = self.validateCellValue(nextValue, rule, 'manual');

        if (!validation.isValid) {
          self.showError(validation.message);
          cancel();
          return;
        }
      }

      self.hideError();
      success(nextValue);
    }

    input.addEventListener('blur', onChange);

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        onChange();
      }

      if (e.key === 'Escape') {
        cancel();
      }
    });

    return input;
  }

  /**
   * Initialize Tabulator from configured headers.
   */
  private initTableFromConfiguredHeaders() {
    const rules = this.getConfiguredColumnRules();
    const headers = rules.map((rule) => rule.header);

    if (!this.refs.tabulatorTarget) {
      return;
    }

    if (!headers.length) {
      this.showError(
        'Please configure at least one table header in the builder.',
      );
      return;
    }

    this.hideError();

    this._table?.destroy();
    this._table = null;

    const isPreview = this.isBuilderPreview();
    const initialRows = [this.createBlankRow(headers)];
    const self = this;

    const columns: any[] = headers.map((header) => {
      return {
        title: header,
        field: header,
        editor: isPreview
          ? undefined
          : function (cell: any, onRendered: any, success: any, cancel: any) {
              return self.createInputEditor(
                cell,
                onRendered,
                success,
                cancel,
                rules,
              );
            },
      };
    });

    this._table = new Tabulator(this.refs.tabulatorTarget, {
      data: initialRows,
      layout: 'fitDataStretch',
      renderHorizontal: 'virtual',

      selectableRange: !isPreview ? 1 : false,
      selectableRangeColumns: !isPreview,
      selectableRangeRows: !isPreview,
      selectableRangeClearCells: !isPreview,

      editTriggerEvent: 'dblclick',

      clipboard: !isPreview,
      clipboardCopyStyled: false,
      clipboardCopyConfig: {
        rowHeaders: false,
        columnHeaders: false,
      },
      clipboardCopyRowRange: 'range',
      clipboardPasteParser: 'range',
      clipboardPasteAction: 'range',

      rowHeader: {
        resizable: false,
        frozen: true,
        width: 40,
        hozAlign: 'center',
        formatter: 'rownum',
      },

      columnDefaults: {
        headerSort: false,
        headerHozAlign: 'center',
        resizable: 'header',
        width: 180,
      },

      columns,
    });

    if (!isPreview) {
      this._table.on('cellEdited', () => {
        if (this._isMutatingTable) return;
        this.hideError();
        this.normalizeTableRows(headers);
      });

      this._table.on('dataChanged', () => {
        if (this._isMutatingTable) return;
        //this.hideError();
        this.syncValueFromTable(headers);
      });
    }

    const existingValue = this.getValue();
    if (
      existingValue &&
      Array.isArray(existingValue.rows) &&
      existingValue.rows.length
    ) {
      const seededRows = existingValue.rows
        .slice(0, this.getMaxRows())
        .map((row) => this.mapRowArrayToObject(row, headers));

      if (seededRows.length < this.getMaxRows()) {
        seededRows.push(this.createBlankRow(headers));
      }

      this._isMutatingTable = true;
      this._table.setData(seededRows).finally(() => {
        this._isMutatingTable = false;
        this.syncValueFromTable(headers);
      });
    } else {
      this.setStoredValue(
        {
          headers,
          rows: [],
        },
        false,
      );
    }
  }

  /**
   * Handle paste into table area.
   * Entire paste is rejected if any row/column/value fails validation.
   */
  private handleNativePaste = (e: ClipboardEvent) => {
    const rules = this.getConfiguredColumnRules();
    const headers = rules.map((rule) => rule.header);

    if (!headers.length || !this._table || this.isBuilderPreview()) {
      return;
    }

    const text = e.clipboardData?.getData('text') || '';
    if (!text) {
      return;
    }

    e.preventDefault();

    const parsedRows = this.parseClipboard(text);

    if (!parsedRows.length || parsedRows.length === 1) {
      this.showError('Please copy at least one header row and one data row.');
      return;
    }

    const dataRows = parsedRows.slice(1);

    if (!dataRows.length) {
      this.showError(
        'Only a header row was pasted. Please copy data rows as well.',
      );
      return;
    }

    if (dataRows.length > this.getMaxRows()) {
      this.showError(
        `The pasted content exceeds the maximum allowed ${this.getMaxRows()} data rows.`,
      );
      return;
    }

    const pasteValidation = this.validatePastedRows(dataRows, rules);

    if (!pasteValidation.isValid) {
      this.showError(pasteValidation.message);
      return;
    }

    this.hideError();
    this.appendRowsFromClipboard(headers, dataRows);
  };

  /**
   * Validate all pasted rows before accepting any value.
   * Rejects extra columns and any invalid cell.
   */
  private validatePastedRows(
    dataRows: string[][],
    rules: PasteTableColumnRule[],
  ): { isValid: boolean; message: string } {
    let rowIndex = 0;
    let colIndex = 0;

    for (rowIndex = 0; rowIndex < dataRows.length; rowIndex += 1) {
      const row = dataRows[rowIndex];

      if (row.length > rules.length) {
        return {
          isValid: false,
          message:
            'The pasted content has more columns than this table allows.',
        };
      }

      for (colIndex = 0; colIndex < row.length; colIndex += 1) {
        const rule = rules[colIndex];
        const value = row[colIndex] ?? '';
        const validation = this.validateCellValue(value, rule, 'paste');

        if (!validation.isValid) {
          return validation;
        }
      }
    }

    return { isValid: true, message: '' };
  }

  /**
   * Append pasted rows after validation succeeds.
   */
  private appendRowsFromClipboard(headers: string[], dataRows: string[][]) {
    if (!this._table) return;

    const maxRows = this.getMaxRows();
    const existingRows = this._table.getData() as Record<string, any>[];

    const enteredRows = existingRows
      .map((rowObj) => this.mapRowObjectToArray(rowObj, headers))
      .filter((row) => row.some((cell) => String(cell).trim() !== ''));

    const normalizedIncomingRows = dataRows.map((row) => {
      return headers.map((_, index) => row[index] ?? '');
    });

    const combinedRows = enteredRows.concat(normalizedIncomingRows);

    if (combinedRows.length > maxRows) {
      this.showError(
        `The pasted content exceeds the maximum allowed ${maxRows} data rows.`,
      );
      return;
    }

    const nextRows = combinedRows.map((row) =>
      this.mapRowArrayToObject(row, headers),
    );

    if (combinedRows.length < maxRows) {
      nextRows.push(this.createBlankRow(headers));
    }

    this._isMutatingTable = true;
    this._table.setData(nextRows).finally(() => {
      this._isMutatingTable = false;
      this.syncValueFromTable(headers);
    });
  }

  /**
   * Show component-level message.
   */
  private showError(msg: string) {
    if (!this.refs.errorMsg) return;
    this.refs.errorMsg.textContent = msg;
    this.refs.errorMsg.style.display = 'block';
  }

  /**
   * Hide component-level message.
   */
  private hideError() {
    if (!this.refs.errorMsg) return;
    this.refs.errorMsg.textContent = '';
    this.refs.errorMsg.style.display = 'none';
  }

  /**
   * Return current stored value.
   */
  getValue(): PasteTableValue {
    return this._tableValue;
  }

  /**
   * Public setter used by Form.io.
   */
  setValue(value: PasteTableValue) {
    this.setStoredValue(value, true);
    return true;
  }
}

Components.addComponent('pasteTable', PasteTableComponent);
