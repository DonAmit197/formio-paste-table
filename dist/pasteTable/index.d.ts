/** @format */
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
    tableHeaders?: Array<{
        value?: string;
    } | string>;
    maxRows?: number;
    customMessage?: string;
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
                    addAnother?: undefined;
                    components?: undefined;
                } | {
                    type: string;
                    key: string;
                    label: string;
                    input: boolean;
                    defaultValue: boolean;
                    validate?: undefined;
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
                    addAnother?: undefined;
                    components?: undefined;
                } | {
                    type: string;
                    key: string;
                    label: string;
                    input: boolean;
                    defaultValue: string;
                    validate?: undefined;
                    addAnother?: undefined;
                    components?: undefined;
                } | {
                    type: string;
                    key: string;
                    label: string;
                    input: boolean;
                    addAnother: string;
                    components: {
                        type: string;
                        key: string;
                        label: string;
                        input: boolean;
                    }[];
                    defaultValue?: undefined;
                    validate?: undefined;
                })[];
            }[];
        }[];
    };
    /**
     * Detect whether component is being rendered in builder/edit preview mode.
     * In this mode the grid should be read-only and should not emit user-change events.
     */
    private isBuilderPreview;
    /**
     * Returns configured headers from builder schema.
     */
    private getConfiguredHeaders;
    /**
     * Returns max row limit set by builder.
     */
    private getMaxRows;
    /**
     * Returns validation message.
     */
    private getValidationMessage;
    /**
     * Returns helper text displayed above the table.
     */
    private getInfoMessage;
    /**
     * Render label + helper text + error text + table target.
     */
    render(): string;
    /**
     * Attach refs, events and initialize Tabulator.
     */
    attach(element: HTMLElement): void | Promise<void>;
    /**
     * Cleanup listeners and table instance.
     */
    detach(): void;
    /**
     * Form.io required checks call isEmpty in many flows.
     * We treat the component as empty when there is no complete row.
     */
    isEmpty(value: PasteTableValue): boolean;
    /**
     * Hook into Form.io validation lifecycle.
     * This supports change / next / submit flows.
     */
    checkValidity(data: any, dirty: boolean, rowData?: any, options?: any, silentCheck?: boolean): any;
    /**
     * Returns component-specific validation message or empty string.
     */
    private getComponentValidationMessage;
    /**
     * Returns row arrays from saved value.
     */
    private getEnteredRowsFromValue;
    /**
     * Returns true when every cell in the row has a non-empty value.
     */
    private isCompleteRowArray;
    /**
     * Returns true when a row has some values but not all values.
     */
    private isPartiallyFilledRowArray;
    /**
     * Create a blank row object from headers.
     */
    private createBlankRow;
    /**
     * Parse tab/newline clipboard text into a 2D array.
     */
    private parseClipboard;
    /**
     * Normalize a row object into a simple string array aligned with headers.
     */
    private mapRowObjectToArray;
    /**
     * Normalize a row array into an object aligned with headers.
     */
    private mapRowArrayToObject;
    /**
     * Internal value setter.
     * Use emitChange=false during initialization/preview so builder dialog does not lose focus.
     */
    private setStoredValue;
    /**
     * Convert current table data into submission shape.
     * Preserve all non-blank rows so validation can inspect partial rows.
     */
    private syncValueFromTable;
    /**
     * Ensure the table keeps:
     * - entered rows only
     * - maximum row limit
     * - one blank row at bottom when limit is not reached
     */
    private normalizeTableRows;
    /**
     * Small custom text editor for better mouse interaction inside cell editing.
     */
    private createInputEditor;
    /**
     * Initialize Tabulator from configured headers.
     */
    private initTableFromConfiguredHeaders;
    /**
     * Intercept native paste, skip first row as header,
     * truncate extra rows and columns silently,
     * then normalize the table.
     */
    private handleNativePaste;
    /**
     * Append pasted rows, enforce max row limit,
     * and keep one blank row at bottom when possible.
     */
    private appendRowsFromClipboard;
    /**
     * Show inline component message.
     * Used for validation message and paste-specific helper message.
     */
    private showError;
    /**
     * Hide inline component message.
     */
    private hideError;
    /**
     * Return current value.
     */
    getValue(): PasteTableValue;
    /**
     * Public setter used by Form.io.
     */
    setValue(value: PasteTableValue): boolean;
}
export {};
