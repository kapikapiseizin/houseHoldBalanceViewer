import type { Category, PaymentRequest, BalanceResponse, SheetOperator } from "./SheetOperator";
import { CategoryMasterFormat, BudgetMasterFormat, PaymentTableFormat, CarryOverSummaryFormat, BudgetDisplayCategoryMasterFormat } from "./SheetFormat";

export class GoogleSheetOperator implements SheetOperator {

    private accessToken: string;
    private spreadSheetID: string;

    constructor(accessToken: string, spreadSheetID: string) {
        this.accessToken = accessToken;
        this.spreadSheetID = spreadSheetID;
    }

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

    computeBalance(): Promise<BalanceResponse[]> {
        return Promise.resolve([
            { title: "テスト食費", budgetAmount: 50000, carryOverAmount: 10000, usedAmount: 60000 },
            { title: "テスト日用品", budgetAmount: 20000, carryOverAmount: 10000, usedAmount: 15000 },
            { title: "テスト娯楽", budgetAmount: 10000, carryOverAmount: 0, usedAmount: 2000 }
        ]);
    }
}