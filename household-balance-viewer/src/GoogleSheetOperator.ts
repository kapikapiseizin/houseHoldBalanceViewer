import type { SheetOperator } from "./SheetOperator";

export class GoogleSheetOperator implements SheetOperator {
    constructor(accessToken: string, spreadSheetID: string) { }
}