/** @format */

import {Components} from 'formiojs';
import {TabulatorFull as Tabulator} from 'tabulator-tables';
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
  addRowBtn?: HTMLButtonElement;
  deleteRowBtn?: HTMLButtonElement;
  maxRowMsg?: HTMLDivElement;
  deleteHint?: HTMLDivElement;
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
  disabled?: boolean;
  [key: string]: any;
};

type CellValidationResult = {
  isValid: boolean;
  message: string;
  severity: 'none' | 'business' | 'security';
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
  implements BaseComponentInstance {
  declare refs: PasteTableRefs;

  private _table: Tabulator | null = null;
  private _tableValue: PasteTableValue = null;
  private _isMutatingTable = false;
  private _isDetached = false;
  private _initAttemptId = 0;
  private _selectedRow: any = null;
  private _lastPointerType: string = '';

  private handlePointerUp = (e: PointerEvent) => {
    this._lastPointerType = e.pointerType;
  };

  private handleCaptureClick = (e: MouseEvent) => {
    if (this._lastPointerType === 'touch') {
      this._lastPointerType = '';
      e.stopPropagation();
      e.stopImmediatePropagation();
    }
  };

  static schema(...extend: any[]) {
    return (BaseComponent.schema as any)(
      {
        type: 'pasteTable',
        label: 'Paste Table',
        key: 'pasteTable',
        input: true,
        tableHeaders: [],
        maxRows: 10,
        customMessage: 'Add table content to continue.',
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
                  defaultValue: 'Add table content to continue.',
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
                          {label: 'Alphabet', value: 'alphabet'},
                          {label: 'Numeric', value: 'numeric'},
                          {
                            label: 'Alphabet and Numeric',
                            value: 'alphanumeric',
                          },
                          {label: 'Email', value: 'email'},
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

  get defaultValue() {
    let defaultValue = (this.component.defaultValue ?? '').trim();

    if (defaultValue === '') {
      return null;
    }

    const headers = this.getConfiguredColumnRules().map((rule) => rule.header);
    return {
      headers: headers,
      rows: [defaultValue.split(',').map((d: string) => d.trim())]
    };
  }

  private isBuilderPreview(): boolean {
    return !!(
      (this as any).builderMode ||
      (this.options && this.options.builder)
    );
  }

  private isReadOnlyMode(): boolean {
    return !!(
      this.isBuilderPreview() ||
      (this.options && this.options.readOnly) ||
      (this.component && this.component.disabled)
    );
  }

  private getMaxRows(): number {
    const raw = Number(this.component.maxRows);
    if (!raw || raw < 1) {
      return 10;
    }
    return Math.floor(raw);
  }

  private getValidationMessage(): string {
    const msg = this.component.customMessage;
    if (msg && String(msg).trim()) {
      return String(msg).trim();
    }

    return 'Add table content to continue.';
  }

  private getUserInformation(): string {
    const info = this.component.userInformation;
    return info && String(info).trim() ? String(info).trim() : '';
  }

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

  private isValidDataType(value: any): value is PasteTableDataType {
    return (
      value === 'alphabet' ||
      value === 'numeric' ||
      value === 'alphanumeric' ||
      value === 'email'
    );
  }

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

        <div class="paste-error text-danger" ref="errorMsg" style="display:none;"></div>

        <div class="paste-table-wrap" style="overflow-x: auto; -webkit-overflow-scrolling: touch;">
          <div ref="tabulatorTarget"></div>
        </div>

         ${
      !this.isReadOnlyMode()
        ? `<div class="paste-table-add-row-footer">
              <button type="button" class="btn btn-secondary btn-sm paste-table-add-row-btn" ref="addRowBtn">+ Add Row</button>
              <button type="button" class="btn btn-warning btn-sm paste-table-delete-row-btn" ref="deleteRowBtn" style="display:none;">Delete Row</button>
              <div class="paste-table-max-row-msg text-muted" ref="maxRowMsg" style="display:none;">Maximum row limit of ${this.getMaxRows()} has been reached.</div>
              <div class="paste-table-delete-hint text-muted" ref="deleteHint">Select a row, then click Delete row.</div>
            </div>`
        : ''
    }
      </div>
    `);
  }

  attach(element: HTMLElement) {
    const attached = super.attach(element);

    this._isDetached = false;
    this._initAttemptId += 1;

    this.loadRefs(element, {
      labelEl: 'single',
      userInfoEl: 'single',
      infoMsg: 'single',
      errorMsg: 'single',
      tabulatorTarget: 'single',
      addRowBtn: 'single',
      deleteRowBtn: 'single',
      maxRowMsg: 'single',
      deleteHint: 'single',
    });

    if (!this.isReadOnlyMode()) {
      this.refs.tabulatorTarget?.addEventListener(
        'paste',
        this.handleNativePaste,
      );
      this.refs.tabulatorTarget?.addEventListener(
        'keydown',
        this.handleTableKeyDown,
      );
      this.refs.tabulatorTarget?.addEventListener('pointerup', this.handlePointerUp, {passive: true});
      this.refs.tabulatorTarget?.addEventListener('click', this.handleCaptureClick, true);
      this.refs.addRowBtn?.addEventListener('click', this.handleAddRow);
      this.refs.deleteRowBtn?.addEventListener('click', this.handleDeleteRow);
      this.refs.deleteRowBtn?.addEventListener(
        'keydown',
        this.handleDeleteButtonKeyDown,
      );
    }

    this.scheduleSafeInit(this._initAttemptId, 0);

    return attached;
  }

  detach() {
    this._isDetached = true;
    this._initAttemptId += 1;

    this.refs.tabulatorTarget?.removeEventListener(
      'paste',
      this.handleNativePaste,
    );
    this.refs.tabulatorTarget?.removeEventListener(
      'keydown',
      this.handleTableKeyDown,
    );
    this.refs.tabulatorTarget?.removeEventListener('pointerup', this.handlePointerUp);
    this.refs.tabulatorTarget?.removeEventListener('click', this.handleCaptureClick, true);
    this.refs.addRowBtn?.removeEventListener('click', this.handleAddRow);
    this.refs.deleteRowBtn?.removeEventListener('click', this.handleDeleteRow);
    this.refs.deleteRowBtn?.removeEventListener(
      'keydown',
      this.handleDeleteButtonKeyDown,
    );

    if (this._table) {
      try {
        this._table.destroy();
      } catch (err) {
        // Ignore teardown race errors.
      }
      this._table = null;
    }

    this._selectedRow = null;

    return super.detach();
  }

  private handleTableKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Delete') {
      e.preventDefault();
      e.stopPropagation();
    }
  };
  private handleDeleteButtonKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Delete') {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.handleDeleteRow();
    }
  };

  private scheduleSafeInit(attemptId: number, retryCount: number) {
    const self = this;

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (self._isDetached || attemptId !== self._initAttemptId) {
          return;
        }

        if (self.isTargetReadyForInit()) {
          self.initTableFromConfiguredHeaders();
          return;
        }

        if (retryCount < 12) {
          self.scheduleSafeInit(attemptId, retryCount + 1);
        }
      });
    });
  }

  private scheduleSafeHydrate(attemptId: number, retryCount: number) {
    const self = this;

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (self._isDetached || attemptId !== self._initAttemptId) {
          return;
        }

        if (!self._table || !self.isTargetReadyForInit()) {
          if (retryCount < 12) {
            self.scheduleSafeHydrate(attemptId, retryCount + 1);
          }
          return;
        }

        self.applyStoredValueToTable();
      });
    });
  }

  private isTargetReadyForInit(): boolean {
    const target = this.refs.tabulatorTarget;

    if (!target) {
      return false;
    }

    if (!target.isConnected) {
      return false;
    }

    const rect = target.getBoundingClientRect();
    const hasSize = rect.width > 0 || rect.height > 0;
    const hasParent = !!target.offsetParent || !!target.closest('body');

    return !!(hasSize && hasParent);
  }

  isEmpty(value: PasteTableValue) {
    const enteredRows = this.getEnteredRowsFromValue(value);
    const completeRows = enteredRows.filter((row) =>
      this.isCompleteRowArray(row),
    );

    return completeRows.length === 0;
  }

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

  private isPartiallyFilledRowArray(row: string[]): boolean {
    const hasAny = row.some((cell) => String(cell || '').trim() !== '');
    const hasAnyEmpty = row.some((cell) => String(cell || '').trim() === '');

    return hasAny && hasAnyEmpty;
  }

  private createBlankRow(headers: string[]): Record<string, string> {
    const row: Record<string, string> = {};

    headers.forEach((header) => {
      row[header] = '';
    });

    return row;
  }

  private parseClipboard(text: string): string[][] {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n')
      .filter((line) => line.trim() !== '')
      .map((line) => line.split('\t').map((cell) => cell.trim()));
  }

  private mapRowObjectToArray(
    rowObj: Record<string, any>,
    headers: string[],
  ): string[] {
    return headers.map((header) => {
      const value = rowObj[header];
      return value == null ? '' : String(value);
    });
  }

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

  private setStoredValue(value: PasteTableValue, emitChange: boolean) {
    this._tableValue = value;
    this.dataValue = value;

    if (emitChange) {
      this.triggerChange();
    }
  }

  private syncValueFromTable(headers: string[]) {
    if (!this._table) return;

    const tableData = this._table.getData() as Record<string, any>[];

    const rows = tableData
      .map((rowObj) => this.mapRowObjectToArray(rowObj, headers))
      .filter((row) => row.some((cell) => String(cell).trim() !== ''));

    if (!rows.length) {
      this._tableValue = null;
      this.dataValue = (this as any).emptyValue ?? null;

      if (!this.isBuilderPreview()) {
        this.triggerChange();
      }

      this.updateAddRowButtonVisibility();
      return;
    }

    this.setStoredValue(
      {
        headers,
        rows,
      },
      !this.isBuilderPreview(),
    );
    this.updateAddRowButtonVisibility();
  }

  private normalizeTableRows(headers: string[]) {
    if (!this._table) return;

    const maxRows = this.getMaxRows();
    const currentRows = this._table.getData() as Record<string, any>[];

    const normalizedRows = currentRows
      .map((rowObj) =>
        this.mapRowArrayToObject(
          this.mapRowObjectToArray(rowObj, headers),
          headers,
        ),
      )
      .slice(0, maxRows);

    this._isMutatingTable = true;
    this._table.setData(normalizedRows).finally(() => {
      this._isMutatingTable = false;
      this.syncValueFromTable(headers);
      this.updateAddRowButtonVisibility();
    });
  }

  /**
   * Security patterns should trigger hard-clear behavior.
   * Business-rule mismatches should not.
   */
  private validateCellValue(
    value: string,
    rule: PasteTableColumnRule,
    mode: 'paste' | 'manual',
  ): CellValidationResult {
    const trimmedValue = value == null ? '' : String(value);

    if (trimmedValue === '') {
      return {isValid: true, message: '', severity: 'none'};
    }

    if (this.containsUnsafePattern(trimmedValue)) {
      return {
        isValid: false,
        severity: 'security',
        message:
          mode === 'paste'
            ? `"${rule.header}" contains characters that aren’t supported.`
            : `"${rule.header}" contains characters that aren’t supported.`,
      };
    }

    if (trimmedValue.length > rule.maxChars) {
      return {
        isValid: false,
        severity: 'business',
        message:
          mode === 'paste'
            ? ` "${rule.header}"  can be no longer than ${rule.maxChars} characters.`
            : ` "${rule.header}"  can be no longer than ${rule.maxChars} characters.`,
      };
    }

    if (!this.matchesDataType(trimmedValue, rule.dataType)) {
      return {
        isValid: false,
        severity: 'business',
        message:
          mode === 'paste'
            ? `"${rule.header}"  must be a (${this.getDataTypeLabel(rule.dataType)}).`
            : `"${rule.header}"  must be a (${this.getDataTypeLabel(rule.dataType)}).`,
      };
    }

    return {isValid: true, message: '', severity: 'none'};
  }

  private containsUnsafePattern(value: string): boolean {
    return /<|>|javascript:|vbscript:|data:text\/html|on\w+\s*=|<script|<img|<svg|<iframe|&lt;|&gt;/i.test(
      value,
    );
  }

  private getDataTypeLabel(dataType: PasteTableDataType): string {
    if (dataType === 'alphabet') return 'Alphabet';
    if (dataType === 'numeric') return 'Numeric';
    if (dataType === 'alphanumeric') return 'Alphabet and Numeric';
    return 'Email';
  }

  private matchesDataType(
    value: string,
    dataType: PasteTableDataType,
  ): boolean {
    const alphabetRegex = /^[A-Za-z\s'’-]+$/;
    const numericRegex = /^\d+(\.\d{1,2})?$/;
    const alphaNumericRegex = /^[A-Za-z0-9\s'’-]+$/;
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
   * Hard clear only for security-level issues.
   */
  private clearComponentToEmpty() {
    this._tableValue = null;
    this.dataValue = (this as any).emptyValue ?? null;

    if (!this.isBuilderPreview()) {
      this.triggerChange();
    }

    if (!this._table) {
      return;
    }

    const blankRows: Record<string, string>[] = [];

    this._isMutatingTable = true;
    this._table.setData(blankRows).finally(() => {
      this._isMutatingTable = false;
      this.clearSelectedRow();
      this.updateAddRowButtonVisibility();
      this.updateDeleteRowButtonVisibility();
    });
  }

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
    input.style.padding = '8px 10px';
    input.style.minHeight = '36px';
    input.style.width = '100%';
    input.style.height = '100%';
    input.style.boxSizing = 'border-box';
    input.style.border = 'none';
    input.style.outline = 'none';
    input.style.background = 'transparent';

    onRendered(function () {
      const isTouch = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0;
      if (isTouch) {
        input.focus();
      } else {
        setTimeout(() => {
          input.focus();
        }, 0);
      }
    });

    input.addEventListener('mousedown', function (e) {
      if (!('ontouchstart' in window)) {
        // desktop only
        e.stopPropagation();
      }
    });

    input.addEventListener('click', function (e) {
      if (!('ontouchstart' in window)) {
        // desktop only
        e.stopPropagation();
      }
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

          if (validation.severity === 'security') {
            self.clearComponentToEmpty();
          }

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

  private buildRowsFromValue(
    value: PasteTableValue,
    headers: string[],
    isReadOnly: boolean,
  ): Record<string, string>[] {
    if (value && Array.isArray(value.rows) && value.rows.length) {
      return value.rows
        .slice(0, this.getMaxRows())
        .map((row) => this.mapRowArrayToObject(row, headers));
    }

    if (!isReadOnly && headers.length) {
      return [this.createBlankRow(headers)];
    }

    return [];
  }

  private getInitialTableData(
    headers: string[],
    isReadOnly: boolean,
  ): Record<string, string>[] {
    const existingValue =
      (this.dataValue as PasteTableValue) || this.getValue();

    if (existingValue) {
      this._tableValue = existingValue;
      this.dataValue = existingValue;

      const seededRows = this.buildRowsFromValue(
        existingValue,
        headers,
        isReadOnly,
      );

      if (!isReadOnly && seededRows.length === 0) {
        return [this.createBlankRow(headers)];
      }

      return seededRows;
    }

    this._tableValue = null;
    this.dataValue = (this as any).emptyValue ?? null;

    if (!isReadOnly && headers.length) {
      return [this.createBlankRow(headers)];
    }

    return [];
  }

  private applyStoredValueToTable() {
    if (!this._table) {
      return;
    }

    const rules = this.getConfiguredColumnRules();
    const headers = rules.map((rule) => rule.header);
    const isReadOnly = this.isReadOnlyMode();
    const value = (this.dataValue as PasteTableValue) || this._tableValue;
    const rows = this.buildRowsFromValue(value, headers, isReadOnly);

    this._isMutatingTable = true;
    this._table.setData(rows).finally(() => {
      this._isMutatingTable = false;
      this.clearSelectedRow();
      this.updateAddRowButtonVisibility();
      this.updateDeleteRowButtonVisibility();
    });
  }

  private initTableFromConfiguredHeaders() {
    const rules = this.getConfiguredColumnRules();
    const headers = rules.map((rule) => rule.header);

    if (!this.refs.tabulatorTarget || this._isDetached) {
      return;
    }

    if (!headers.length) {
      this.showError(
        'Please configure at least one table header in the builder.',
      );
      return;
    }

    this.hideError();

    if (this._table) {
      try {
        this._table.destroy();
      } catch (err) {
        // Ignore.
      }
      this._table = null;
    }

    const isReadOnly = this.isReadOnlyMode();
    const self = this;
    const initialData = this.getInitialTableData(headers, isReadOnly);

    const columns: any[] = headers.map((header) => {
      return {
        title: header,
        field: header,
        editor: isReadOnly
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

    const isTouchDevice =
      typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0;

    const tableOptions: any = {
      data: initialData,
      layout: 'fitDataStretch',
      renderHorizontal: 'basic',
      selectableRange: !isReadOnly && !isTouchDevice ? 1 : false,
      selectableRangeColumns: !isReadOnly && !isTouchDevice,
      selectableRangeRows: !isReadOnly && !isTouchDevice,
      selectableRangeClearCells: false,
      selectableRangeAutoFocus: false,
      selectableRangeBlurEditOnNavigate: false,
      editTriggerEvent: 'click',
      clipboard: false,
      rowHeader: {
        resizable: false,
        frozen: true,
        width: 60,
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
    };
    this._table = new Tabulator(this.refs.tabulatorTarget, tableOptions);

    if (!isReadOnly) {
      this._table.on('cellClick', (_e: any, cell: any) => {
        if (isTouchDevice) {
          return;
        }

        this.handleRowSelection(cell.getRow());
      });

      this._table.on('cellTap', (_e: any, cell: any) => {
        if (!isTouchDevice) {
          return;
        }

        cell.edit(true);
      });

      this._table.on('rowClick', (_e: any, row: any) => {
        if (isTouchDevice) return;
        this.handleRowSelection(row);
      });

      this._table.on('rowTap', (_e: any, row: any) => {
        this.handleRowSelection(row);
      });

      this._table.on('cellEdited', () => {
        if (this._isMutatingTable || this._isDetached) return;
        this.normalizeTableRows(headers);
      });

      this._table.on('dataChanged', () => {
        if (this._isMutatingTable || this._isDetached) return;
        this.syncValueFromTable(headers);
      });
    }

    this.clearSelectedRow();
    this.updateAddRowButtonVisibility();
    this.updateDeleteRowButtonVisibility();
  }

  private handleNativePaste = (e: ClipboardEvent) => {
    const rules = this.getConfiguredColumnRules();
    const headers = rules.map((rule) => rule.header);

    if (!headers.length || !this._table || this.isReadOnlyMode()) {
      return;
    }

    const text = e.clipboardData?.getData('text') || '';
    if (!text) {
      return;
    }

    e.preventDefault();

    const parsedRows = this.parseClipboard(text);

    if (!parsedRows.length) {
      this.showError('Please paste at least one row of data.');
      return;
    }

    if (parsedRows.length > this.getMaxRows()) {
      this.showError(
        `Cannot accept more than the allowed ${this.getMaxRows()} rows.`,
      );
      return;
    }

    const pasteValidation = this.validatePastedRows(parsedRows, rules);

    if (!pasteValidation.isValid) {
      this.showError(pasteValidation.message);

      if (pasteValidation.severity === 'security') {
        this.clearComponentToEmpty();
      }

      return;
    }

    this.hideError();
    this.appendRowsFromClipboard(headers, parsedRows);
  };

  private validatePastedRows(
    dataRows: string[][],
    rules: PasteTableColumnRule[],
  ): CellValidationResult {
    let rowIndex = 0;
    let colIndex = 0;

    for (rowIndex = 0; rowIndex < dataRows.length; rowIndex += 1) {
      const row = dataRows[rowIndex];

      if (row.length > rules.length) {
        return {
          isValid: false,
          severity: 'business',
          message: 'The pasted data contains more columns than allowed.',
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

    return {isValid: true, message: '', severity: 'none'};
  }

  private appendRowsFromClipboard(headers: string[], dataRows: string[][]) {
    if (!this._table) return;

    const maxRows = this.getMaxRows();
    const existingRows = this._table.getData() as Record<string, any>[];

    const normalizedExistingRows = existingRows.map((rowObj) =>
      this.mapRowArrayToObject(
        this.mapRowObjectToArray(rowObj, headers),
        headers,
      ),
    );

    const normalizedIncomingRows = dataRows.map((row) =>
      this.mapRowArrayToObject(
        headers.map((_, index) => row[index] ?? ''),
        headers,
      ),
    );

    const nextRows = normalizedExistingRows.slice();

    let incomingIndex = 0;
    let rowIndex = 0;

    for (
      rowIndex = 0;
      rowIndex < nextRows.length &&
      incomingIndex < normalizedIncomingRows.length;
      rowIndex += 1
    ) {
      const currentRowArray = this.mapRowObjectToArray(
        nextRows[rowIndex],
        headers,
      );
      const isBlankRow = currentRowArray.every(
        (cell) => String(cell).trim() === '',
      );

      if (isBlankRow) {
        nextRows[rowIndex] = normalizedIncomingRows[incomingIndex];
        incomingIndex += 1;
      }
    }

    while (incomingIndex < normalizedIncomingRows.length) {
      nextRows.push(normalizedIncomingRows[incomingIndex]);
      incomingIndex += 1;
    }

    if (nextRows.length > maxRows) {
      this.showError(`Cannot accept more than the allowed ${maxRows} rows.`);
      return;
    }

    this._isMutatingTable = true;
    this._table.setData(nextRows).finally(() => {
      this._isMutatingTable = false;
      this.clearSelectedRow();
      this.syncValueFromTable(headers);
      this.updateAddRowButtonVisibility();
      this.updateDeleteRowButtonVisibility();
    });
  }

  private handleRowSelection = (row: any) => {
    if (this.isReadOnlyMode()) return;

    if (this._selectedRow && this._selectedRow !== row) {
      try {
        const prevEl = this._selectedRow.getElement();
        if (prevEl) {
          prevEl.classList.remove('paste-table-row-selected');
        }
      } catch (err) {
        // Ignore stale row reference.
      }
    }

    this._selectedRow = row;

    try {
      const rowEl = row.getElement();
      if (rowEl) {
        rowEl.classList.add('paste-table-row-selected');
      }
    } catch (err) {
      // Ignore.
    }

    this.updateDeleteRowButtonVisibility();
  };
  private handleAddRow = () => {
    const rules = this.getConfiguredColumnRules();
    const headers = rules.map((r) => r.header);

    if (!this._table || !headers.length || this.isReadOnlyMode()) {
      return;
    }

    const maxRows = this.getMaxRows();
    const tableData = this._table.getData() as Record<string, any>[];

    if (tableData.length >= maxRows) {
      this.updateAddRowButtonVisibility();
      return;
    }

    this._table.addRow(this.createBlankRow(headers)).then(() => {
      this.updateAddRowButtonVisibility();
      this.updateDeleteRowButtonVisibility();
    });
  };

  private updateAddRowButtonVisibility() {
    if (!this.refs.addRowBtn && !this.refs.maxRowMsg) return;

    const maxRows = this.getMaxRows();
    const tableData = this._table
      ? (this._table.getData() as Record<string, any>[])
      : [];

    const visibleCount = tableData.length;

    if (visibleCount >= maxRows) {
      if (this.refs.addRowBtn) this.refs.addRowBtn.style.display = 'none';
      if (this.refs.maxRowMsg) this.refs.maxRowMsg.style.display = 'block';
    } else {
      if (this.refs.addRowBtn) this.refs.addRowBtn.style.display = '';
      if (this.refs.maxRowMsg) this.refs.maxRowMsg.style.display = 'none';
    }
  }

  private clearSelectedRow() {
    if (this._selectedRow) {
      try {
        const rowEl = this._selectedRow.getElement();
        if (rowEl) {
          rowEl.classList.remove('paste-table-row-selected');
        }
      } catch (err) {
        // Ignore stale row reference.
      }
    }

    this._selectedRow = null;
    this.updateDeleteRowButtonVisibility();
  }

  private handleDeleteRow = () => {
    if (!this._table || !this._selectedRow || this.isReadOnlyMode()) {
      return;
    }

    const headers = this.getConfiguredColumnRules().map((rule) => rule.header);

    this._isMutatingTable = true;

    this._selectedRow
      .delete()
      .then(() => {
        this._isMutatingTable = false;
        this._selectedRow = null;
        this.syncValueFromTable(headers);
        this.updateAddRowButtonVisibility();
        this.updateDeleteRowButtonVisibility();
      })
      .catch(() => {
        this._isMutatingTable = false;
        this._selectedRow = null;
        this.updateDeleteRowButtonVisibility();
      });
  };

  private updateDeleteRowButtonVisibility() {
    if (!this.refs.deleteRowBtn) return;

    const hasSelection = !!this._selectedRow;
    this.refs.deleteRowBtn.style.display =
      !this.isReadOnlyMode() && hasSelection ? '' : 'none';
  }

  private showError(msg: string) {
    if (!this.refs.errorMsg) return;
    this.refs.errorMsg.textContent = msg;
    this.refs.errorMsg.style.display = 'block';
  }

  private hideError() {
    if (!this.refs.errorMsg) return;
    this.refs.errorMsg.textContent = '';
    this.refs.errorMsg.style.display = 'none';
  }

  getValue(): PasteTableValue {
    return this._tableValue;
  }

  setValue(value: PasteTableValue) {
    this._tableValue = value;
    this.dataValue = value;

    if (this._table) {
      this.scheduleSafeHydrate(this._initAttemptId, 0);
    }

    return true;
  }
}

Components.addComponent('pasteTable', PasteTableComponent);
