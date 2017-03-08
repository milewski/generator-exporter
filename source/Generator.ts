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

    constructor(files: string[]|string, options: OptionsInterface, private logger: Logger = (new Logger)) {

        /**
         * Extend options
         */
        const { closePhotoshop } = Object.assign(this.options, options);

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
        this.renderManager = new RenderManager(this.generator, this.options.generatorOptions, this.logger)
        this.documentManager = new DocumentManager(this.generator, this.options.generatorOptions, this.logger)

        this.renderManager.on('render', (count, { id }) => {
            let document = this.documents[id];
            if (!document) this.documents[id] = new DocData(id)
            else {
                document.assets += 1;
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

    private start() {

        const { closePhotoshop, retryDelay, maxRetries } = this.options

        process.nextTick(() => {

            this.generator
                .start(this.options)
                .timeout(retryDelay)
                .then(() => console.log('Connected!'))
                .then(() => this.processFiles())
                .then(() => closePhotoshop ? this.closePhotoshop() : this.generator.shutdown())
                .then(() => console.log('Assets Exported Successfully :)'))
                .then(() => this.promiseResolver())
                .catch(() => {

                    console.log(`Connecting... Attempts: ${++this.retries} of ${maxRetries}`)

                    if (this.retries < maxRetries) {
                        return this.start();
                    }

                    console.warn('Could not connect to photoshop server. Did you "Enable Remote Connections" under Preferences -> Plug-Ins?');
                    process.exit(1);

                })

        })

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
                                    .then(() => console.log(`Exported: ${this.documents[document.id].assets} Assets`))
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
export default Generator;
