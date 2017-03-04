import { createGenerator } from 'generator-core/lib/generator';
import * as Promise from 'bluebird';
import * as assets from 'generator-assets';
import * as open from 'opn';
import { Logger } from './Logger';

export interface GeneratorAssetsOptionsInterface {
    'svg-enabled'?: boolean,
    'svgomg-enabled'?: boolean,
    'base-directory'?: string,
    'css-enabled'?: boolean,
    'use-smart-scaling'?: boolean,
    'include-ancestor-masks'?: boolean,
    'allow-dither'?: boolean,
    'use-psd-smart-object-pixel-scaling'?: boolean,
    'use-pngquant'?: boolean,
    'convert-color-space'?: boolean,
    'use-flite'?: boolean,
    'embed-icc-profile'?: boolean,
    'clip-all-images-to-document-bounds'?: boolean,
    'clip-all-images-to-artboard-bounds'?: boolean,
    'mask-adds-padding'?: boolean,
    'expand-max-dimensions'?: boolean,
    'webp-enabled'?: boolean,
    'interpolation-type'?: string,
    'icc-profile'?: string,
    'use-jpg-encoding'?: string
}

export interface OptionsInterface {
    closePhotoshop?: boolean,
    hostname?: string,
    password?: string,
    port?: string|number,
    maxRetries?: number,
    retryDelay?: number,
    generatorOptions?: GeneratorAssetsOptionsInterface
}

export default class Exporter {

    private generator;
    private files: string[];
    private completed = false;
    private promiseResolver = null;
    private retries = 0;

    private options: OptionsInterface = {
        hostname: '127.0.0.1',
        password: '123456',
        port: 49494,
        closePhotoshop: true,
        maxRetries: 10,
        retryDelay: 5000,
        generatorOptions: {}
    }

    constructor(files: string[]|string, options: OptionsInterface, private logger: Logger = (new Logger)) {

        /**
         * Extend options
         */
        const { maxRetries, retryDelay, closePhotoshop } = Object.assign(this.options, options);

        if (!Array.isArray(files)) {
            files = [files]
        }

        /**
         * Open a file directly so the photoshop will initialize its interface and the script will work
         * otherwise it will be unable to connect to the generator plugin
         */
        open(files[0], { wait: closePhotoshop })

        this.files = files;
        this.generator = new createGenerator();
        this.generator.on('close', () => {

            if (this.completed) {
                return console.log('Assets Exported Successfully :)');
            }

            if (this.retries++ < maxRetries - 1) {
                console.log(`Connecting... Attempts: ${this.retries} of ${maxRetries}`)
                return setTimeout(this.init.bind(this), retryDelay)
            }

            console.warn('Could not connect to photoshop server. Did you "Enable Remote Connections" under Preferences -> Plug-Ins?');
            process.exit(1);

        })

        this.generator.on('communicationsError', () => {
            this.generator.shutdown();
        })

        this.generator.on('error', error => {
            console.warn('error', error)
            this.generator.shutdown();
        })

        /**
         * Start Process
         */
        // setTimeout(this.init.bind(this), retryDelay)

    }


    private init() {

        const { closePhotoshop } = this.options

        console.log('close?', closePhotoshop)

        this.generator
            .start(this.options)
            .then(() => this.processFiles())
            .then(() => closePhotoshop ? this.closePhotoshop() : this.generator.shutdown())
            .then(() => this.completed = true)
            .then(() => this.promiseResolver())

        /**
         * Resolve the very first promise at the end of execution
         */
        if (!this.promiseResolver) {
            return new Promise(accept => {
                this.promiseResolver = accept
            })
        }

    }

    private processFiles() {

        return Promise.each(this.files, file => {

            return new Promise(resolve => {

                this.open(file)
                    .then(id => {
                        assets.init(this.generator, this.options.generatorOptions, this.logger)
                        assets._stateManager.activate(id);
                        assets._renderManager.on('idle', () => {
                            this.closeDocumentByID(id).then(resolve)
                        })
                    })

            })

        })
    }

    /**
     * Resolves to document ID
     *
     * @param file
     * @returns {any}
     */
    private open<T>(file: string): Promise<T> {
        return this.generator.evaluateJSXString(`app.bringToFront(); app.open(File('${file}')).id`)
    }

    closeDocumentByID(id) {
        return this.generator.evaluateJSXString(`
            for(var index = 0; index < app.documents.length; index++) {
                if(app.documents[index].id === ${id}){
                    app.documents[index].close(SaveOptions.DONOTSAVECHANGES)
                }
            }
        `)
    }

    closeActiveDocument() {
        return this.generator.evaluateJSXString('app.activeDocument.close(SaveOptions.DONOTSAVECHANGES)')
    }

    closeAllDocuments() {
        return this.generator.evaluateJSXString(`
            while(app.documents.length > 0) {  
                app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);  
            }  
        `)
    }

    closePhotoshop() {
        this.closeAllDocuments()
            .then(() => this.generator.evaluateJSXString('executeAction(charIDToTypeID("quit"), undefined, DialogModes.NO )'))
            .then(() => this.generator.shutdown())
    }

}
export const exporter = Exporter;
