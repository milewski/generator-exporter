import { DocDataInterface } from "./Interfaces/DocDataInterface";
export declare class DocData implements DocDataInterface {
    id: number;
    file: string;
    assetsCount: number;

    constructor({ id, file }: {
                    id: any;
                    file: any;
                });
}
