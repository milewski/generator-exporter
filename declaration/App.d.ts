import { Logger } from './Logger';
export interface GeneratorAssetsOptionsInterface {
    'svg-enabled'?: boolean;
    'svgomg-enabled'?: boolean;
    'base-directory'?: string;
    'css-enabled'?: boolean;
    'use-smart-scaling'?: boolean;
    'include-ancestor-masks'?: boolean;
    'allow-dither'?: boolean;
    'use-psd-smart-object-pixel-scaling'?: boolean;
    'use-pngquant'?: boolean;
    'convert-color-space'?: boolean;
    'use-flite'?: boolean;
    'embed-icc-profile'?: boolean;
    'clip-all-images-to-document-bounds'?: boolean;
    'clip-all-images-to-artboard-bounds'?: boolean;
    'mask-adds-padding'?: boolean;
    'expand-max-dimensions'?: boolean;
    'webp-enabled'?: boolean;
    'interpolation-type'?: string;
    'icc-profile'?: string;
    'use-jpg-encoding'?: string;
}
export interface OptionsInterface {
    closePhotoshop?: boolean;
    hostname?: string;
    password?: string;
    port?: string | number;
    maxRetries?: number;
    retryDelay?: number;
    generatorOptions?: GeneratorAssetsOptionsInterface;
}
export default class Exporter {
    private logger;
    private generator;
    private files;
    private completed;
    private promiseResolver;
    private retries;
    private options;
    constructor(files: string[] | string, options: OptionsInterface, logger?: Logger);
    private init();
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
export declare const exporter: typeof Exporter;
