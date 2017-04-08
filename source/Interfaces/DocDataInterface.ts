export interface AssetInterface {
    name: string;
    extension: string;
    file: string;
    size: {
        width: number,
        height: number
    }
}

export interface DocDataInterface {
    assets: AssetInterface[];
    id: number;
    file: string;
    add(asset: AssetInterface)
}
