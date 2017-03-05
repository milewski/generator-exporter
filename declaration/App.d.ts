import { OptionsInterface } from './Interfaces/OptionsInterface';
import { Logger } from './Logger';
export declare class Generator {
    private logger;
    private generator;
    private files;
    private completed;
    private promiseResolver;
    private retries;
    private options;
    constructor(files: string[] | string, options: OptionsInterface, logger?: Logger);
    private start();
    private processFiles();
    /**
     * Resolves to document ID
     *
     * @param file
     * @returns {any}
     */
    private open<T>(file);
    closeDocumentByID(id: any): any;
    closeActiveDocument(): any;
    closeAllDocuments(): any;
    closePhotoshop(): void;
}
export default Generator;
