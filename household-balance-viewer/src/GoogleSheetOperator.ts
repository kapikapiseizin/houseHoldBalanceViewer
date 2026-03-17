import type { Category, PaymentRequest, BalanceResponse, SheetOperator } from "./SheetOperator";
import { CategoryMasterFormat, PaymentTableFormat } from "./SheetFormat";

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

    async requestAddPayment(payment: PaymentRequest): Promise<void> {
        const sheetName = PaymentTableFormat.title;

        // 1. シートの全データ取得
        const getRes = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadSheetID}/values/${encodeURIComponent(sheetName)}`,
            {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`
                }
            }
        );

        const data = await getRes.json();
        const values: string[][] = data.values ?? [];

        if (values.length === 0) {
            throw new Error("シートが空です");
        }

        // 2. ヘッダ取得
        const headers = values[0];

        const colIndexMap: Record<string, number> = {};

        headers.forEach((h, i) => {
            colIndexMap[h] = i;
        });

        const idxID = colIndexMap[PaymentTableFormat.headerPaymentID];
        const idxDate = colIndexMap[PaymentTableFormat.headerPaymentDate];
        const idxTitle = colIndexMap[PaymentTableFormat.headerTitle];
        const idxCategory = colIndexMap[PaymentTableFormat.headerCategoryID];
        const idxAmount = colIndexMap[PaymentTableFormat.headerAmount];

        if (
            idxID === undefined ||
            idxDate === undefined ||
            idxTitle === undefined ||
            idxCategory === undefined ||
            idxAmount === undefined
        ) {
            throw new Error("必要なヘッダが存在しません");
        }

        // 3. 空行探索（決済IDが空）
        let targetRowIndex = values.findIndex((row, i) => {
            if (i === 0) return false;
            return !row[idxID];
        });

        if (targetRowIndex === -1) {
            targetRowIndex = values.length;
        }

        // 4. 行データ作成
        const newRow: string[] = [];

        const paymentID = crypto.randomUUID();

        newRow[idxID] = paymentID;
        newRow[idxDate] = payment.date;
        newRow[idxTitle] = payment.title;
        newRow[idxCategory] = String(payment.categoryID);
        newRow[idxAmount] = String(payment.amount);

        // undefined埋め（列ズレ防止）
        const maxCol = Math.max(idxID, idxDate, idxTitle, idxCategory, idxAmount);
        for (let i = 0; i <= maxCol; i++) {
            if (newRow[i] === undefined) {
                newRow[i] = "";
            }
        }

        // 5. 書き込み
        const range = `${sheetName}!A${targetRowIndex + 1}`;

        await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadSheetID}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
            {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    values: [newRow]
                })
            }
        );
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