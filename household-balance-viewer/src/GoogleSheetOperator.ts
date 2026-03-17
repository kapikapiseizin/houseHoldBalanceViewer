import type { Category, PaymentRequest, BalanceResponse, SheetOperator } from "./SheetOperator";
import { CategoryMasterFormat } from "./SheetFormat";

export class GoogleSheetOperator implements SheetOperator {

    private accessToken: string;
    private spreadSheetID: string;

    constructor(accessToken: string, spreadSheetID: string) {
        this.accessToken = accessToken;
        this.spreadSheetID = spreadSheetID;
    }

    async fetchCategories(): Promise<Category[]> {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadSheetID}/values/${encodeURIComponent(CategoryMasterFormat.title)}`;
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${this.accessToken}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch categories: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const values = data.values as string[][] | undefined;

        if (!values || values.length === 0) {
            return [];
        }

        const headers = values[0];
        const categoryIdIndex = headers.indexOf(CategoryMasterFormat.headerCategoryID);
        const nameIndex = headers.indexOf(CategoryMasterFormat.headerName);

        if (categoryIdIndex === -1 || nameIndex === -1) {
            throw new Error("Required headers not found in the sheet");
        }

        const categories: Category[] = [];

        for (let i = 1; i < values.length; i++) {
            const row = values[i];
            if (!row || row.length === 0) continue;

            const categoryIDStr = row[categoryIdIndex];
            const name = row[nameIndex];

            if (categoryIDStr !== undefined && name !== undefined) {
                categories.push({
                    categoryID: Number(categoryIDStr),
                    name: name
                });
            }
        }

        return categories;
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