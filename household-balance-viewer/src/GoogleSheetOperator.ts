import type { Category, PaymentRequest, BalanceResponse, SheetOperator } from "./SheetOperator";
import { CategoryMasterFormat, PaymentTableFormat, BudgetDisplayCategoryMasterFormat, BudgetMasterFormat, CarryOverSummaryFormat } from "./SheetFormat";

export class GoogleSheetOperator implements SheetOperator {

    private accessToken: string;
    private spreadSheetID: string;

    constructor(accessToken: string, spreadSheetID: string) {
        this.accessToken = accessToken;
        this.spreadSheetID = spreadSheetID;
    }

    async fetchTableHeaderColumnIndex(
        tableTitle: string,
    ): Promise<Record<string, number>> {
        // get first line
        const rangeFirstLine = `${encodeURIComponent(tableTitle)}!1:1`;
        const getRes = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadSheetID}/values/${rangeFirstLine}`,
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

        return colIndexMap;
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

    columnNoToAlphabet = (colNo: number) => String.fromCharCode(64 + colNo);

    parseGvizDate(dateStr: string): Date {
        // 文字列から数字（2026, 2, 1）だけを取り出す
        const matches = dateStr.match(/\d+/g);

        if (matches && matches.length >= 3) {
            const year = parseInt(matches[0], 10);
            const month = parseInt(matches[1], 10); // APIは0始まり(1月=0)で返すのでそのまま使える
            const day = parseInt(matches[2], 10);

            return new Date(year, month, day);
        }

        throw new Error(`Failed to parse date: ${dateStr}`);
    }

    async fetchSheetQuery(tableName: string, query: string, headerLineNo: number = 1): Promise<Response> {
        const encodedQuery = encodeURIComponent(query);

        console.log("query", query);

        const url = `https://docs.google.com/spreadsheets/d/${this.spreadSheetID}/gviz/tq?sheet=${encodeURIComponent(tableName)}&headers=${headerLineNo}&tq=${encodedQuery}`;

        // 取得
        return await fetch(url, {
            headers: {
                Authorization: `Bearer ${this.accessToken}`
            }
        });

    }

    async getRowsByQueryResponse(response: Response): Promise<string[][]> {
        const text = await response.text();

        // gvizはJSONっぽい文字列なのでパース
        const json = JSON.parse(
            text.substring(
                text.indexOf("{"),
                text.lastIndexOf("}") + 1
            )
        );

        if (json.status === "error") {
            console.log("query error:", json);
            return [];
        }

        const rows = json.table.rows.map((row: any) => {
            return row.c.map((cell: any) => {
                // セルが空の場合は null や空文字を返す
                return cell ? (cell.v !== null ? String(cell.v) : "") : "";
            });
        });

        return rows;
    }

    async requestAddPayment(payment: PaymentRequest): Promise<void> {
        const sheetName = PaymentTableFormat.title;

        const colIndexMap = await this.fetchTableHeaderColumnIndex(sheetName);

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

        // 5. 追記
        await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadSheetID}/values/${encodeURIComponent(sheetName)}!A1:append?valueInputOption=USER_ENTERED`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    values: [newRow]
                })
            }
        );
        return Promise.resolve();
    }

    async computeBalance(targetYear: number, targetMonth: number): Promise<BalanceResponse[]> {
        const fetchBudgetDisplayCategories = async () => {
            const sheetName = BudgetDisplayCategoryMasterFormat.title;

            // 1. シート取得
            const res = await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadSheetID}/values/${encodeURIComponent(sheetName)}`,
                {
                    headers: {
                        Authorization: `Bearer ${this.accessToken}`
                    }
                }
            );

            const data = await res.json();
            const values: string[][] = data.values ?? [];

            if (values.length === 0) {
                return [];
            }

            // 2. ヘッダ解析
            const headers = values[0];

            const colIndexMap: Record<string, number> = {};
            headers.forEach((h, i) => {
                colIndexMap[h] = i;
            });

            const idxCategoryID = colIndexMap[BudgetDisplayCategoryMasterFormat.headerCategoryID];
            const idxDisplayOrder = colIndexMap[BudgetDisplayCategoryMasterFormat.headerDisplayOrder];

            if (idxCategoryID === undefined || idxDisplayOrder === undefined) {
                throw new Error("必要なヘッダが存在しません");
            }

            // 3. データ取得
            const rows: { categoryID: number; displayOrder: number }[] = [];

            for (let i = 1; i < values.length; i++) {
                const row = values[i];

                const rawCategoryID = row[idxCategoryID];
                const rawDisplayOrder = row[idxDisplayOrder];

                // 空行スキップ
                if (!rawCategoryID || !rawDisplayOrder) continue;

                const categoryID = Number(rawCategoryID);
                const displayOrder = Number(rawDisplayOrder);

                if (isNaN(categoryID) || isNaN(displayOrder)) continue;

                rows.push({
                    categoryID,
                    displayOrder
                });
            }

            // 4. ソート
            rows.sort((a, b) => a.displayOrder - b.displayOrder);

            // 5. categoryIDのみ抽出
            return rows.map(r => r.categoryID);
        }

        const fetchLatestCarryOverSummery = async (
            tableName: string,
            columnNoCategoryID: number,
            columnNoMeasurementYearMonth: number,
            columnNoCarryOverAmount: number,
            targetYear: number,
            targetMonth: number
        ) => {
            const query = `
                SELECT *
                WHERE (
                    year(${this.columnNoToAlphabet(columnNoMeasurementYearMonth)}) < ${targetYear} 
                ) OR (
                    year(${this.columnNoToAlphabet(columnNoMeasurementYearMonth)}) = ${targetYear} AND month(${this.columnNoToAlphabet(columnNoMeasurementYearMonth)}) <= ${targetMonth - 1}
                )
                ORDER BY ${this.columnNoToAlphabet(columnNoMeasurementYearMonth)} DESC
            `;

            const res = await this.fetchSheetQuery(tableName, query);

            const rows = await this.getRowsByQueryResponse(res);

            console.log("fetchLatestCarryOverSummery rows", rows);

            const categoryIDToCarryOverAmount = new Map<number, { measurementYear: number, measurementMonth: number, carryOverAmount: number }>();
            for (const row of rows) {
                const measureDate = this.parseGvizDate(row[columnNoMeasurementYearMonth - 1]);

                const categoryID = Number(row[columnNoCategoryID - 1]);
                const measurementYear = measureDate.getFullYear();
                const measurementMonth = measureDate.getMonth() + 1;
                const carryOverAmount = Number(row[columnNoCarryOverAmount - 1]);

                if (categoryIDToCarryOverAmount.has(categoryID)) {
                    continue;
                }

                categoryIDToCarryOverAmount.set(categoryID, { measurementYear, measurementMonth, carryOverAmount });
            }

            return categoryIDToCarryOverAmount;
        }

        const computeUsedAmount = async () => {
            const paymentColIndexMap = await this.fetchTableHeaderColumnIndex(PaymentTableFormat.title);

            const columnNoID = paymentColIndexMap[PaymentTableFormat.headerPaymentID] + 1;
            const columnNoDate = paymentColIndexMap[PaymentTableFormat.headerPaymentDate] + 1;
            const columnNoTitle = paymentColIndexMap[PaymentTableFormat.headerTitle] + 1;
            const columnNoCategory = paymentColIndexMap[PaymentTableFormat.headerCategoryID] + 1;
            const columnNoAmount = paymentColIndexMap[PaymentTableFormat.headerAmount] + 1;

            if (
                columnNoID === undefined ||
                columnNoDate === undefined ||
                columnNoTitle === undefined ||
                columnNoCategory === undefined ||
                columnNoAmount === undefined
            ) {
                throw new Error("必要なヘッダが存在しません");
            }

            // Visualization API用クエリ

            const query = `
                SELECT ${this.columnNoToAlphabet(columnNoCategory)}, SUM(${this.columnNoToAlphabet(columnNoAmount)})
                WHERE year(${this.columnNoToAlphabet(columnNoDate)}) = ${targetYear} AND month(${this.columnNoToAlphabet(columnNoDate)}) = ${targetMonth - 1}
                GROUP BY ${this.columnNoToAlphabet(columnNoCategory)}
            `;

            const res = await this.fetchSheetQuery(PaymentTableFormat.title, query);

            const rowsCategoryIDtoUsedAmount = await this.getRowsByQueryResponse(res);

            const categoryIDtoUsedAmount = new Map<number, number>();
            for (const row of rowsCategoryIDtoUsedAmount) {
                const categoryID = Number(row[0]);
                const usedAmount = Number(row[1]);
                categoryIDtoUsedAmount.set(categoryID, usedAmount);
            }

            return categoryIDtoUsedAmount;
        }

        const computeBudgetAmount = async () => {
            const budgetColIndexMap = await this.fetchTableHeaderColumnIndex(BudgetMasterFormat.title);

            const columnNoCategoryID = budgetColIndexMap[BudgetMasterFormat.headerCategoryID] + 1;
            const columnTargetYearMonth = budgetColIndexMap[BudgetMasterFormat.headerTargetYearMonth] + 1;
            const columnNoBudgetAmount = budgetColIndexMap[BudgetMasterFormat.headerBudgetAmount] + 1;

            if (
                columnNoCategoryID === undefined ||
                columnNoBudgetAmount === undefined ||
                columnTargetYearMonth === undefined
            ) {
                throw new Error("必要なヘッダが存在しません");
            }

            const query = `
                SELECT ${this.columnNoToAlphabet(columnNoCategoryID)}, ${this.columnNoToAlphabet(columnNoBudgetAmount)}, ${this.columnNoToAlphabet(columnTargetYearMonth)}
                WHERE (
                    year(${this.columnNoToAlphabet(columnTargetYearMonth)}) < ${targetYear} 
                ) OR (
                    year(${this.columnNoToAlphabet(columnTargetYearMonth)}) = ${targetYear} AND month(${this.columnNoToAlphabet(columnTargetYearMonth)}) <= ${targetMonth - 1}
                )
                ORDER BY ${this.columnNoToAlphabet(columnTargetYearMonth)} DESC
            `;

            const res = await this.fetchSheetQuery(BudgetMasterFormat.title, query);
            const rowsCategoryIDtoBudgetAmount = await this.getRowsByQueryResponse(res);

            const categoryIDtoBudgetAmount = new Map<number, number>();
            for (const row of rowsCategoryIDtoBudgetAmount) {
                const categoryID = Number(row[0]);
                const budgetAmount = Number(row[1]);

                if (categoryIDtoBudgetAmount.has(categoryID)) {
                    continue;
                }

                categoryIDtoBudgetAmount.set(categoryID, budgetAmount);
            }

            return categoryIDtoBudgetAmount;
        }

        const carrySummeryHeaderColIndex = await this.fetchTableHeaderColumnIndex(CarryOverSummaryFormat.title);

        const columnNoCategoryID = carrySummeryHeaderColIndex[CarryOverSummaryFormat.headerCategoryID] + 1;
        const columnNoMeasurementYearMonth = carrySummeryHeaderColIndex[CarryOverSummaryFormat.headerMeasurementYearMonth] + 1;
        const columnNoCarryOverAmount = carrySummeryHeaderColIndex[CarryOverSummaryFormat.headerCarryOverAmount] + 1;

        if (
            columnNoCategoryID === undefined ||
            columnNoMeasurementYearMonth === undefined ||
            columnNoCarryOverAmount === undefined
        ) {
            throw new Error("必要なヘッダが存在しません");
        }

        const budgetDisplayCategories = await fetchBudgetDisplayCategories();

        const latestSummeryCategoryIDtoCarryOver = await fetchLatestCarryOverSummery(
            CarryOverSummaryFormat.title,
            columnNoCategoryID,
            columnNoMeasurementYearMonth,
            columnNoCarryOverAmount,
            targetYear,
            targetMonth - 1 // get last month
        );

        console.log("latestSummeryCategoryIDtoCarryOver", latestSummeryCategoryIDtoCarryOver);

        // TODO:used memo payment table
        const categoryIDtoUsedAmount = await computeUsedAmount();
        const categoryIDtoBudgetAmount = await computeBudgetAmount();

        console.log("budgetDisplayCategories", budgetDisplayCategories);
        console.log("categoryIDtoUsedAmount", categoryIDtoUsedAmount);
        console.log("categoryIDtoBudgetAmount", categoryIDtoBudgetAmount);

        return Promise.resolve([
            { title: "テスト食費", budgetAmount: 50000, carryOverAmount: 10000, usedAmount: 60000 },
            { title: "テスト日用品", budgetAmount: 20000, carryOverAmount: 10000, usedAmount: 15000 },
            { title: "テスト娯楽", budgetAmount: 10000, carryOverAmount: 0, usedAmount: 2000 }
        ]);
    }
}