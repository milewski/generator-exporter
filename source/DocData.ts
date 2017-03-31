import { DocDataInterface } from "./Interfaces/DocDataInterface";

export class DocData implements DocDataInterface {

    public id: number;
    public file: string;
    public assetsCount: number = 1;

    constructor({ id, file }) {
        this.id = id;
        this.file = file;
    }

}
