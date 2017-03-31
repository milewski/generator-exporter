import { OptionsInterface } from './Interfaces/OptionsInterface';
import { Logger } from './Logger';
import { DocData } from "./DocData";
import * as Promise from 'bluebird';
export declare class Generator {
    private logger;
    private generator;
    private renderManager;
    private documentManager;
    private documents;
    private files;
    private promiseResolver;
    private retries;
    private options;
    constructor(files: string[] | string, options?: OptionsInterface, logger?: Logger);
    start(): Promise<DocData[]>;
    private launchPhotoshop(files);
    private startGenerator();
    private processFiles();
    /**
     * Resolves to document ID
     */
    private open(file);
    private closeDocumentByID(id);
    closeActiveDocument(): any;
    closeAllDocuments(): any;
    closePhotoshop(): any;
    /**
     * Returns all non PSD files
     * @param files
     * @returns string[]
     */
    private isPSD(files);
    /**
     * Returns all non Existing files
     *
     * @param files
     * @returns string[]
     */
    private filesExists(files);
}
export default Generator;
