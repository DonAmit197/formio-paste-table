/** @format */
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
declare const PasteTableComponent_base: new (...args: unknown[]) => BaseComponentInstance;
export default class PasteTableComponent extends PasteTableComponent_base implements BaseComponentInstance {
    refs: PasteTableRefs;
    private _table;
    private _tableValue;
    private _isMutatingTable;
    static schema(...extend: any[]): any;
    static get builderInfo(): {
        title: string;
        icon: string;
        group: string;
        weight: number;
        schema: any;
    };
    static editForm(): {
        components: {
            type: string;
            key: string;
            components: {
                label: string;
                key: string;
                components: ({
                    type: string;
                    key: string;
                    label: string;
                    input: boolean;
                    defaultValue?: undefined;
                    validate?: undefined;
                    rows?: undefined;
                    addAnother?: undefined;
                    components?: undefined;
                } | {
                    type: string;
                    key: string;
                    label: string;
                    input: boolean;
                    defaultValue: boolean;
                    validate?: undefined;
                    rows?: undefined;
                    addAnother?: undefined;
                    components?: undefined;
                } | {
                    type: string;
                    key: string;
                    label: string;
                    input: boolean;
                    defaultValue: number;
                    validate: {
                        min: number;
                        integer: boolean;
                    };
                    rows?: undefined;
                    addAnother?: undefined;
                    components?: undefined;
                } | {
                    type: string;
                    key: string;
                    label: string;
                    input: boolean;
                    defaultValue: string;
                    validate?: undefined;
                    rows?: undefined;
                    addAnother?: undefined;
                    components?: undefined;
                } | {
                    type: string;
                    key: string;
                    label: string;
                    input: boolean;
                    rows: number;
                    defaultValue?: undefined;
                    validate?: undefined;
                    addAnother?: undefined;
                    components?: undefined;
                } | {
                    type: string;
                    key: string;
                    label: string;
                    input: boolean;
                    addAnother: string;
                    components: ({
                        type: string;
                        key: string;
                        label: string;
                        input: boolean;
                        defaultValue?: undefined;
                        validate?: undefined;
                        dataSrc?: undefined;
                        data?: undefined;
                    } | {
                        type: string;
                        key: string;
                        label: string;
                        input: boolean;
                        defaultValue: number;
                        validate: {
                            min: number;
                            integer: boolean;
                        };
                        dataSrc?: undefined;
                        data?: undefined;
                    } | {
                        type: string;
                        key: string;
                        label: string;
                        input: boolean;
                        defaultValue: string;
                        dataSrc: string;
                        data: {
                            values: {
                                label: string;
                                value: string;
                            }[];
                        };
                        validate?: undefined;
                    })[];
                    defaultValue?: undefined;
                    validate?: undefined;
                    rows?: undefined;
                })[];
            }[];
        }[];
    };
    /**
     * Detect builder/edit preview mode.
     * In this mode the grid remains read-only and does not emit runtime change behavior.
     */
    private isBuilderPreview;
    /**
     * Return max data rows configured by builder.
     */
    private getMaxRows;
    /**
     * Return configured validation message.
     */
    private getValidationMessage;
    /**
     * Optional builder-provided user information shown under label.
     */
    private getUserInformation;
    /**
     * Standard helper text shown above table.
     */
    private getInfoMessage;
    /**
     * Normalize column rules from builder settings.
     */
    private getConfiguredColumnRules;
    /**
     * Return header titles only for submission payload.
     */
    /**
     * Check if a provided value is a supported data type.
     */
    private isValidDataType;
    /**
     * Render label + optional user info + helper text + error + table target.
     */
    render(): string;
    /**
     * Attach refs, listeners and initialize grid.
     */
    attach(element: HTMLElement): void | Promise<void>;
    /**
     * Cleanup listeners and table instance.
     */
    detach(): void;
    /**
     * Form.io empty-state check.
     */
    isEmpty(value: PasteTableValue): boolean;
    /**
     * Hook into Form.io validation lifecycle.
     */
    checkValidity(data: any, dirty: boolean, rowData?: any, options?: any, silentCheck?: boolean): any;
    /**
     * Component-specific validation message.
     */
    private getComponentValidationMessage;
    /**
     * Extract entered rows from current stored value.
     */
    private getEnteredRowsFromValue;
    /**
     * True when every cell in row has a non-empty value.
     */
    private isCompleteRowArray;
    /**
     * True when row has some values but not all.
     */
    private isPartiallyFilledRowArray;
    /**
     * Create one blank row object aligned to headers.
     */
    private createBlankRow;
    /**
     * Parse clipboard text into 2D row array.
     */
    private parseClipboard;
    /**
     * Normalize table row object into string array aligned to headers.
     */
    private mapRowObjectToArray;
    /**
     * Normalize row array into object aligned to headers.
     */
    private mapRowArrayToObject;
    /**
     * Internal setter to avoid unnecessary change firing in builder preview.
     */
    private setStoredValue;
    /**
     * Persist current table rows into submission shape.
     */
    private syncValueFromTable;
    /**
     * Ensure table keeps only entered rows, respects max rows,
     * and adds one blank row at bottom while space remains.
     */
    private normalizeTableRows;
    /**
     * Validate a single cell value against suspicious content, length and data type.
     * Empty values are allowed here and handled later by required/incomplete-row validation.
     */
    private validateCellValue;
    /**
     * Basic unsafe-content detection for plain-text cell input.
     * This is a practical first-pass rejection, not full OWASP coverage.
     */
    private containsUnsafePattern;
    /**
     * Human-readable data type label.
     */
    private getDataTypeLabel;
    /**
     * Data type matcher.
     */
    private matchesDataType;
    /**
     * Find column rule by header field.
     */
    private getRuleByHeader;
    /**
     * Custom input editor used for runtime editing.
     * Invalid manual edits are rejected and previous value is restored.
     */
    private createInputEditor;
    /**
     * Initialize Tabulator from configured headers.
     */
    private initTableFromConfiguredHeaders;
    /**
     * Handle paste into table area.
     * Entire paste is rejected if any row/column/value fails validation.
     */
    private handleNativePaste;
    /**
     * Validate all pasted rows before accepting any value.
     * Rejects extra columns and any invalid cell.
     */
    private validatePastedRows;
    /**
     * Append pasted rows after validation succeeds.
     */
    private appendRowsFromClipboard;
    /**
     * Show component-level message.
     */
    private showError;
    /**
     * Hide component-level message.
     */
    private hideError;
    /**
     * Return current stored value.
     */
    getValue(): PasteTableValue;
    /**
     * Public setter used by Form.io.
     */
    setValue(value: PasteTableValue): boolean;
}
export {};
