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
  infoMsg?: HTMLDivElement;
  errorMsg?: HTMLDivElement;
  tabulatorTarget?: HTMLDivElement;
};

type PasteTableSchema = {
  label?: string;
  tableHeaders?: Array<{ value?: string } | string>;
  maxRows?: number;
  customMessage?: string;
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
   * Detect whether component is being rendered in builder/edit preview mode.
   * In this mode the grid should be read-only and should not emit user-change events.
   */
  private isBuilderPreview(): boolean {
    return !!(
      (this as any).builderMode ||
      (this.options && this.options.builder)
    );
  }

  /**
   * Returns configured headers from builder schema.
   */
  private getConfiguredHeaders(): string[] {
    return (this.component.tableHeaders || [])
      .map((item: any) => {
        if (typeof item === 'string') return item.trim();
        return item && item.value ? item.value.trim() : '';
      })
      .filter(Boolean);
  }

  /**
   * Returns max row limit set by builder.
   */
  private getMaxRows(): number {
    const raw = Number(this.component.maxRows);
    if (!raw || raw < 1) {
      return 10;
    }
    return Math.floor(raw);
  }

  /**
   * Returns validation message.
   */
  private getValidationMessage(): string {
    const msg = this.component.customMessage;
    if (msg && String(msg).trim()) {
      return String(msg).trim();
    }

    return 'Please add at least one complete row and do not leave incomplete rows in the table.';
  }

  /**
   * Returns helper text displayed above the table.
   */
  private getInfoMessage(): string {
    return `Paste spreadsheet rows directly into the table below. The copied first row will be treated as headers and skipped automatically. Maximum allowed data rows: ${this.getMaxRows()}. Incomplete rows are not allowed.`;
  }

  /**
   * Render label + helper text + error text + table target.
   */
  render() {
    const labelText = this.component.label ? String(this.component.label) : '';
    const isRequired = !!(
      this.component.validate && this.component.validate.required
    );

    return super.render(`
      <div class="paste-table-root">
        ${
          labelText
            ? `<label class="control-label paste-table-label" ref="labelEl">
                ${labelText}${isRequired ? ' <span class="field-required">*</span>' : ''}
              </label>`
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
   * Attach refs, events and initialize Tabulator.
   */
  attach(element: HTMLElement) {
    const attached = super.attach(element);

    this.loadRefs(element, {
      labelEl: 'single',
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
   * Form.io required checks call isEmpty in many flows.
   * We treat the component as empty when there is no complete row.
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
   * This supports change / next / submit flows.
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
   * Returns component-specific validation message or empty string.
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
   * Returns row arrays from saved value.
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
   * Returns true when every cell in the row has a non-empty value.
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
   * Returns true when a row has some values but not all values.
   */
  private isPartiallyFilledRowArray(row: string[]): boolean {
    const hasAny = row.some((cell) => String(cell || '').trim() !== '');
    const hasAnyEmpty = row.some((cell) => String(cell || '').trim() === '');

    return hasAny && hasAnyEmpty;
  }

  /**
   * Create a blank row object from headers.
   */
  private createBlankRow(headers: string[]): Record<string, string> {
    const row: Record<string, string> = {};

    headers.forEach((header) => {
      row[header] = '';
    });

    return row;
  }

  /**
   * Parse tab/newline clipboard text into a 2D array.
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
   * Normalize a row object into a simple string array aligned with headers.
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
   * Normalize a row array into an object aligned with headers.
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
   * Internal value setter.
   * Use emitChange=false during initialization/preview so builder dialog does not lose focus.
   */
  private setStoredValue(value: PasteTableValue, emitChange: boolean) {
    this._tableValue = value;
    this.dataValue = value;

    if (emitChange) {
      this.triggerChange();
    }
  }

  /**
   * Convert current table data into submission shape.
   * Preserve all non-blank rows so validation can inspect partial rows.
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
   * Ensure the table keeps:
   * - entered rows only
   * - maximum row limit
   * - one blank row at bottom when limit is not reached
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
   * Small custom text editor for better mouse interaction inside cell editing.
   */
  private createInputEditor(
    cell: any,
    onRendered: any,
    success: any,
    cancel: any,
  ) {
    const input = document.createElement('input');
    const currentValue = cell.getValue() == null ? '' : String(cell.getValue());

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

    function onChange() {
      if (input.value !== currentValue) {
        success(input.value);
      } else {
        cancel();
      }
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
    const headers = this.getConfiguredHeaders();

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

    const safeHeaders = headers.map((header, index) =>
      header && header.trim() ? header.trim() : `Column ${index + 1}`,
    );

    const initialRows = [this.createBlankRow(safeHeaders)];

    const self = this;

    const columns = safeHeaders.map((header) => {
      return {
        title: header,
        field: header,
        editor: isPreview
          ? undefined
          : function (cell: any, onRendered: any, success: any, cancel: any) {
              return self.createInputEditor(cell, onRendered, success, cancel);
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
        this.normalizeTableRows(safeHeaders);
      });

      this._table.on('dataChanged', () => {
        if (this._isMutatingTable) return;
        this.syncValueFromTable(safeHeaders);
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
        .map((row) => this.mapRowArrayToObject(row, safeHeaders));

      if (seededRows.length < this.getMaxRows()) {
        seededRows.push(this.createBlankRow(safeHeaders));
      }

      this._isMutatingTable = true;
      this._table.setData(seededRows).finally(() => {
        this._isMutatingTable = false;
        this.syncValueFromTable(safeHeaders);
      });
    } else {
      this.setStoredValue(
        {
          headers: safeHeaders,
          rows: [],
        },
        false,
      );
    }
  }

  /**
   * Intercept native paste, skip first row as header,
   * truncate extra rows and columns silently,
   * then normalize the table.
   */
  private handleNativePaste = (e: ClipboardEvent) => {
    const headers = this.getConfiguredHeaders();

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

    this.hideError();
    this.appendRowsFromClipboard(headers, dataRows);
  };

  /**
   * Append pasted rows, enforce max row limit,
   * and keep one blank row at bottom when possible.
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

    const finalEnteredRows = enteredRows
      .concat(normalizedIncomingRows)
      .slice(0, maxRows);

    const nextRows = finalEnteredRows.map((row) =>
      this.mapRowArrayToObject(row, headers),
    );

    if (finalEnteredRows.length < maxRows) {
      nextRows.push(this.createBlankRow(headers));
    }

    this._isMutatingTable = true;
    this._table.setData(nextRows).finally(() => {
      this._isMutatingTable = false;
      this.syncValueFromTable(headers);
    });
  }

  /**
   * Show inline component message.
   * Used for validation message and paste-specific helper message.
   */
  private showError(msg: string) {
    if (!this.refs.errorMsg) return;
    this.refs.errorMsg.textContent = msg;
    this.refs.errorMsg.style.display = 'block';
  }

  /**
   * Hide inline component message.
   */
  private hideError() {
    if (!this.refs.errorMsg) return;
    this.refs.errorMsg.textContent = '';
    this.refs.errorMsg.style.display = 'none';
  }

  /**
   * Return current value.
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
