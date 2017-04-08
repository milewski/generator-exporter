import { DocDataInterface, AssetInterface } from "./Interfaces/DocDataInterface";

export class DocData implements DocDataInterface {

    public id: number;
    public file: string;
    public assets = [];

    constructor({ id, file }) {
        this.id = id;
        this.file = file;
    }

    public add(asset: AssetInterface) {
        this.assets.push(asset)
    }

}
