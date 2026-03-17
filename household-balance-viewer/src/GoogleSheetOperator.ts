import type { Category, PaymentRequest, SheetOperator } from "./SheetOperator";

export class GoogleSheetOperator implements SheetOperator {
    constructor(accessToken: string, spreadSheetID: string) { }

    fetchCategories(): Promise<Category[]> {
        return Promise.resolve([
            { categoryID: 0, name: "テスト食費" },
            { categoryID: 1, name: "テスト日用品" },
            { categoryID: 2, name: "テスト娯楽" }
        ]);
    }

    requestAddPayment(payment: PaymentRequest): Promise<void> {
        console.log(payment);
        return Promise.resolve();
    }
}