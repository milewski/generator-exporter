import { DocDataInterface } from "./Interfaces/DocDataInterface";

export class DocData implements DocDataInterface {

    public id;
    public assets = 1;

    constructor(id) {
        this.id = id
    }

}
