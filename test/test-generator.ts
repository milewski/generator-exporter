import { Generator } from "../source/Generator";
import * as expect from "expect.js";
import * as del from "del";
import * as path from "path";
import * as glob from "glob";
import { DocData } from "../source/DocData";
import * as fs from "fs";

/**
 * Helpers
 */
function cleanUp() {
    return del([
        path.resolve(__dirname, 'sample-assets/**'),
        path.resolve(__dirname, 'custom-folder/**'),
    ])
}

describe('Generator', () => {

    const options = { password: '123456', closePhotoshop: false };
    const samplePSD = path.resolve(__dirname, 'sample.psd')

    beforeEach(() => {
        return cleanUp()
    });

    after(() => {

        return new Generator(samplePSD, options)
            .closePhotoshop()
            .then(cleanUp)

    })

    it('should fail if no files were provided', () => {
        return expect(() => {
            new Generator([], options)
        }).to.throwException(/no PSD files provided/)
    });

    it('should fail if some files doesn\'t exist in disk', () => {
        return expect(() => {
            new Generator([samplePSD, path.resolve(__dirname, 'invalid/file.psd')], options)
        }).to.throwException(/Invalid files, are you sure they exists\? .*\/file\.psd$/)
    });

    it('should fail if some of the files are not of type .psd', () => {
        return expect(() => {
            new Generator([samplePSD, path.resolve(__dirname, 'test-generator.ts')], options)
        }).to.throwException(/Only PSD files are supported: .*\/test-generator\.ts$/)
    });

    it('should export all the file assets correctly', () => {

        return new Generator(samplePSD, options)
            .start()
            .then(files => {

                expect(files).to.be.an(Array);

                files.forEach(file => {
                    expect(file).to.be.an(DocData)
                    expect(file.assetsCount).to.be(8)
                })

                /**
                 * Test against the real files written in disk
                 */

                let generatedFilesGroupedByExtension: { [key: string]: string[] } = glob
                    .sync(path.resolve(__dirname, 'sample-assets/**.*'))
                    .map(file => ({ key: path.parse(file).ext.slice(1), file }))
                    .reduce((p, { key, file }) => !(p[key] ? p[key].push(file) : p[key] = [file]) || p, {})

                expect(generatedFilesGroupedByExtension.png).to.have.length(6)
                expect(generatedFilesGroupedByExtension.jpg).to.have.length(2)

            })

    });

    it('should export multiple files as well', () => {
        return new Generator(Array(3).fill(samplePSD), options)
            .start()
            .then(files => {

                files.forEach(file => {
                    expect(file.assetsCount).to.be(8)
                })

                expect(files).to.be.an(Array);
                expect(files).to.have.length(3);

            })

    })

    it('should export assets to a custom folder', () => {

        let folder = path.resolve(__dirname, 'custom-folder'),
            customOptions = {
                generatorOptions: { 'base-directory': folder }
            };

        return new Generator(samplePSD, Object.assign(customOptions, options))
            .start()
            .then(() => {
                expect(fs.existsSync(folder)).to.be(true)
            });

    })

})
