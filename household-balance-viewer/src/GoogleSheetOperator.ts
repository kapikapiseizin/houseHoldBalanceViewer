import type { Category, SheetOperator } from "./SheetOperator";

export class GoogleSheetOperator implements SheetOperator {
    constructor(accessToken: string, spreadSheetID: string) { }

    fetchCategories(): Promise<Category[]> {
        return Promise.resolve([
            { id: 0, name: "テスト食費" },
            { id: 1, name: "テスト日用品" },
            { id: 2, name: "テスト娯楽" }
        ]);
    }
}