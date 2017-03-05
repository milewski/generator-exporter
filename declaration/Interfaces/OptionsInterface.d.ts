import { GeneratorAssetsOptionsInterface } from './GeneratorAssetsOptionsInterface';
export interface OptionsInterface {
    closePhotoshop?: boolean;
    hostname?: string;
    password?: string;
    port?: string | number;
    maxRetries?: number;
    retryDelay?: number;
    generatorOptions?: GeneratorAssetsOptionsInterface;
}
