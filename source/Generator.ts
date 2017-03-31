import { createGenerator } from 'generator-core/lib/generator';
import { OptionsInterface } from './Interfaces/OptionsInterface';
import { DocDataInterface } from "./Interfaces/DocDataInterface";
import { Logger } from './Logger';
import { DocData } from "./DocData";
import * as Promise from 'bluebird';
import * as PromiseRetry from 'promise-retry';
import * as open from 'opn';

import * as AssetManager from 'generator-assets/lib/assetmanager';
import * as RenderManager from 'generator-assets/lib/rendermanager';
import * as DocumentManager from 'generator-assets/lib/documentmanager';
import * as fs from "fs";
import * as child_process from "child_process";

export class Generator {

    private generator;
    private renderManager;
    private documentManager;
    private documents: { [key: string]: DocDataInterface } = {};
    private files: string[];
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

    constructor(files: string[] | string, options: OptionsInterface = {}, private logger: Logger = (new Logger)) {

        if (!files.length) {
            throw new Error('no PSD files provided');
        }

        /**
         * Extend options
         */
        Object.assign(this.options, options);

        if (!Array.isArray(files)) {
            files = [files]
        }

        let nonExistingFiles = this.filesExists(files);

        if (nonExistingFiles.length) {
            throw new Error('Invalid files, are you sure they exists? ' + nonExistingFiles.join(', '))
        }

        let nonPSDs = this.isPSD(files);

        if (nonPSDs.length) {
            throw new Error('Only PSD files are supported: ' + nonPSDs.join(', '))
        }

        /**
         * Open a file directly so the photoshop will initialize its interface and the script will work
         * otherwise it will be unable to connect to the generator plugin
         */
        this.launchPhotoshop(files);

        this.files = files;
        this.generator = new createGenerator();
        this.renderManager = new RenderManager(this.generator, this.options.generatorOptions, this.logger)
        this.documentManager = new DocumentManager(this.generator, this.options.generatorOptions, this.logger)

        this.renderManager.on('render', (count, { id, file }) => {
            let document = this.documents[id];
            if (!document) this.documents[id] = new DocData({ id, file })
            else {
                document.assetsCount += 1;
            }
        })

        this.generator.on('communicationsError', (error) => {
            console.warn('communicationsError', error)
            this.generator.shutdown();
        })

        this.generator.on('error', error => {
            console.warn('error', error)
            this.generator.shutdown();
        })

    }

    public start(): Promise<DocData[]> {

        process.nextTick(() => {

            this.startGenerator()
                .then(() => this.processFiles())
                .then(() => this.options.closePhotoshop ? this.closePhotoshop() : this.generator.shutdown())
                .then(() => console.log('Assets Exported Successfully :)'))
                .then(() => this.promiseResolver(
                    Object.keys(this.documents).map(key => this.documents[key]))
                )

        })

        /**
         * Resolve the very first promise at the end of execution
         */
        if (!this.promiseResolver) {
            return new Promise<DocData[]>(accept => {
                this.promiseResolver = accept
            })
        }

    }

    private launchPhotoshop(files) {

        let { closePhotoshop } = this.options;

        if (process.platform === 'darwin') {
            let args = ['-b', 'com.adobe.Photoshop', '--fresh']
            if (closePhotoshop) args.push('--wait-apps')
            child_process.spawn('open', args)
        } else {
            open(files[0], { wait: closePhotoshop })
        }

    }

    private startGenerator() {

        if (this.generator.isConnected()) {
            return Promise.resolve()
        }

        let { maxRetries, retryDelay } = this.options;

        return this.generator
            .start(this.options)
            .timeout(retryDelay)
            .then(() => console.log('Connected!'))
            .catch(() => {

                console.log(`Connecting... Attempts: ${++this.retries} of ${maxRetries}`)

                if (this.retries < maxRetries) {
                    return this.startGenerator();
                }

                console.warn('Could not connect to photoshop server. Did you "Enable Remote Connections" under Preferences -> Plug-Ins?');
                process.exit(1);

            })
    }

    private processFiles() {

        return Promise.each(this.files, file => {

            return PromiseRetry((retry, number) => {

                return this.open(file)
                    .timeout(5000)
                    .then(id => this.documentManager.getDocument(id))
                    .then(document => {

                        console.log(`Processing: ${file}`)

                        const assetsManager = new AssetManager(
                            this.generator, this.options.generatorOptions, this.logger, document, this.renderManager
                        )

                        assetsManager.start();

                        return new Promise(resolve => {

                            assetsManager.once('idle', () => {
                                assetsManager.stop();
                                this.closeDocumentByID(document.id)
                                    .then(() => console.log(`Exported: ${this.documents[document.id].assetsCount} Assets`))
                                    .then(() => resolve());
                            })

                        })

                    })
                    .catch(() => {

                        console.log(`Retrying to open: ${file}`)

                        /**
                         * If opening with Extension Script fails too many times.. try to open the file manually
                         */
                        if (number > 5) {
                            open(file)
                        }

                        retry()

                    })
            }, { factor: 1 })

        })

    }

    /**
     * Resolves to document ID
     */
    private open(file: string): Promise<Number> {
        return this.generator.evaluateJSXString(`app.bringToFront(); app.open(File('${file}')).id`)
    }

    private closeDocumentByID(id) {
        return this.generator.evaluateJSXString(`
            for(var index = 0; index < app.documents.length; index++) {
                if(app.documents[index].id === ${id}){
                    app.documents[index].close(SaveOptions.DONOTSAVECHANGES)
                }
            }
        `)
    }

    public closeActiveDocument() {
        return this.startGenerator().then(() => {
            return this.generator.evaluateJSXString('app.activeDocument.close(SaveOptions.DONOTSAVECHANGES)')
        })
    }

    public closeAllDocuments() {
        return this.startGenerator().then(() => {
            return this.generator.evaluateJSXString(`
                while(app.documents.length > 0) {
                    app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);
                }
            `)
        })
    }

    public closePhotoshop() {
        return this.closeAllDocuments()
            .then(() => this.generator.evaluateJSXString('executeAction(charIDToTypeID("quit"), undefined, DialogModes.NO )'))
            .then(() => this.generator.shutdown())
    }

    /**
     * Returns all non PSD files
     * @param files
     * @returns string[]
     */
    private isPSD(files: string[]): string[] {
        return files.filter(file => !/\.(psd|PSD)$/.test(file))
    }

    /**
     * Returns all non Existing files
     *
     * @param files
     * @returns string[]
     */
    private filesExists(files: string[]): string[] {
        return files.filter(file => !fs.existsSync(file));
    }

}

export default Generator;
