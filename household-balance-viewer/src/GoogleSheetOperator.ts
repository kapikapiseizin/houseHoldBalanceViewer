import type { Category, PaymentRequest, BalanceResponse, SheetOperator } from "./SheetOperator";
import { CategoryMasterFormat, PaymentTableFormat, BudgetDisplayCategoryMasterFormat, BudgetMasterFormat } from "./SheetFormat";

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

    addYearMonth(
        srcYear: number,
        srcMonth: number,
        addYear: number,
        addMonth: number
    ): { year: number, month: number } {
        // 1. month(1~12) → monthIndex(0~11)
        const srcMonthIndex = srcMonth - 1;

        // 2. 全てを「総月数」に変換
        const totalMonths =
            srcYear * 12 + srcMonthIndex +
            addYear * 12 + addMonth;

        // 3. 年と月に戻す
        const year = Math.floor(totalMonths / 12);
        const monthIndex = totalMonths % 12;

        // 4. JSの % は負を返す可能性があるので補正
        const normalizedMonthIndex =
            (monthIndex + 12) % 12;

        // 5. monthIndex → month(1~12)
        const month = normalizedMonthIndex + 1;

        return { year, month };
    }

    sqlWhereMaxYearMonth(
        column: string,
        maxYear: number,
        maxMonth: number
    ): string {
        return `(
            (
                year(${column}) < ${maxYear} 
            ) OR (
                year(${column}) = ${maxYear} AND month(${column}) <= ${maxMonth - 1}
            )
        )`;
    }

    sqlWhereMinYearMonth(
        column: string,
        minYear: number,
        minMonth: number
    ): string {
        return `(
            (
                year(${column}) > ${minYear} 
            ) OR (
                year(${column}) = ${minYear} AND month(${column}) >= ${minMonth - 1}
            )
        )`;
    }

    async fetchIDtoSumInPeriod(
        tableName: string,
        idColumn: string,
        dateColumn: string,
        amountColumn: string,
        startYear: number | undefined = undefined,
        startMonth: number | undefined = undefined,
        endYear: number,
        endMonth: number
    ): Promise<Map<number, number>> {
        const wherePeriod = startYear === undefined || startMonth === undefined ?
            `${this.sqlWhereMaxYearMonth(dateColumn, endYear, endMonth)}`
            : `(
                    ${this.sqlWhereMinYearMonth(dateColumn, startYear, startMonth)}
                    AND
                    ${this.sqlWhereMaxYearMonth(dateColumn, endYear, endMonth)}
                ) `;

        const query = `
                SELECT ${idColumn}, SUM(${amountColumn})
                WHERE ${wherePeriod}
                GROUP BY ${idColumn}
            `;

        const res = await this.fetchSheetQuery(tableName, query);

        const rows = await this.getRowsByQueryResponse(res);

        const idToSumMap: Map<number, number> = new Map();

        rows.forEach((row) => {
            const id = Number(row[0]);
            const amount = Number(row[1]);
            idToSumMap.set(id, amount);
        });

        return idToSumMap;
    }

    async selectTableInPeriodOrderByDateAsc(
        tableName: string,
        dateColumn: string,
        startYear: number | undefined = undefined,
        startMonth: number | undefined = undefined,
        endYear: number,
        endMonth: number
    ): Promise<string[][]> {
        const wherePeriod = startYear === undefined || startMonth === undefined ?
            `${this.sqlWhereMaxYearMonth(dateColumn, endYear, endMonth)}`
            : `(
                    ${this.sqlWhereMinYearMonth(dateColumn, startYear, startMonth)}
                    AND
                    ${this.sqlWhereMaxYearMonth(dateColumn, endYear, endMonth)}
                ) `;

        const query = `
                SELECT * 
                WHERE ${wherePeriod}
                ORDER BY ${dateColumn} ASC
            `;

        const res = await this.fetchSheetQuery(tableName, query);

        const rows = await this.getRowsByQueryResponse(res);

        return rows;
    }

    async fetchSheetQuery(tableName: string, query: string, headerLineNo: number = 1): Promise<Response> {
        const encodedQuery = encodeURIComponent(query);
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

        const budgetDisplayCategories = await fetchBudgetDisplayCategories();

        const { year: lastMonthTargetYear, month: lastMonthTargetMonth } = this.addYearMonth(targetYear, targetMonth, 0, -1);

        const categories = await this.fetchCategories();
        const categoryIDtoName = new Map<number, string>();
        for (const category of categories) {
            categoryIDtoName.set(category.categoryID, category.name);
        }

        const paymentHeaderColIndex = await this.fetchTableHeaderColumnIndex(PaymentTableFormat.title);

        const paymentColNoHeaderCategoryID = paymentHeaderColIndex[PaymentTableFormat.headerCategoryID] + 1;
        const paymentColNoHeaderPaymentDate = paymentHeaderColIndex[PaymentTableFormat.headerPaymentDate] + 1;
        const paymentColNoHeaderAmount = paymentHeaderColIndex[PaymentTableFormat.headerAmount] + 1;

        if (paymentColNoHeaderCategoryID === undefined ||
            paymentColNoHeaderPaymentDate === undefined ||
            paymentColNoHeaderAmount === undefined) {
            throw new Error("必要なヘッダが存在しません");
        }

        const targetCategoryIDtoUsedAmount = await this.fetchIDtoSumInPeriod(
            PaymentTableFormat.title,
            this.columnNoToAlphabet(paymentColNoHeaderCategoryID),
            this.columnNoToAlphabet(paymentColNoHeaderPaymentDate),
            this.columnNoToAlphabet(paymentColNoHeaderAmount),
            targetYear,
            targetMonth,
            targetYear,
            targetMonth
        );

        const lastCategoryIDtoUsedAmount = await this.fetchIDtoSumInPeriod(
            PaymentTableFormat.title,
            this.columnNoToAlphabet(paymentColNoHeaderCategoryID),
            this.columnNoToAlphabet(paymentColNoHeaderPaymentDate),
            this.columnNoToAlphabet(paymentColNoHeaderAmount),
            undefined,
            undefined,
            lastMonthTargetYear,
            lastMonthTargetMonth
        );

        const budgetMasterHeaderColIndex = await this.fetchTableHeaderColumnIndex(BudgetMasterFormat.title);

        const budgetColNoHeaderCategoryID = budgetMasterHeaderColIndex[BudgetMasterFormat.headerCategoryID] + 1;
        const budgetColNoHeaderTargetYearMonth = budgetMasterHeaderColIndex[BudgetMasterFormat.headerTargetYearMonth] + 1;
        const budgetColNoHeaderBudgetAmount = budgetMasterHeaderColIndex[BudgetMasterFormat.headerBudgetAmount] + 1;

        if (budgetColNoHeaderCategoryID === undefined ||
            budgetColNoHeaderTargetYearMonth === undefined ||
            budgetColNoHeaderBudgetAmount === undefined) {
            throw new Error("必要なヘッダが存在しません");
        }

        const targetCategoryIDtoBudgetAmount = await this.fetchIDtoSumInPeriod(
            BudgetMasterFormat.title,
            this.columnNoToAlphabet(budgetColNoHeaderCategoryID),
            this.columnNoToAlphabet(budgetColNoHeaderTargetYearMonth),
            this.columnNoToAlphabet(budgetColNoHeaderBudgetAmount),
            targetYear,
            targetMonth,
            targetYear,
            targetMonth
        );

        const lastCategoryIDtoBudgetAmount = await this.fetchIDtoSumInPeriod(
            BudgetMasterFormat.title,
            this.columnNoToAlphabet(budgetColNoHeaderCategoryID),
            this.columnNoToAlphabet(budgetColNoHeaderTargetYearMonth),
            this.columnNoToAlphabet(budgetColNoHeaderBudgetAmount),
            undefined,
            undefined,
            lastMonthTargetYear,
            lastMonthTargetMonth
        );

        const balanceResponses: BalanceResponse[] = [];
        for (const categoryID of budgetDisplayCategories) {
            const title = categoryIDtoName.get(categoryID) ?? "";
            const budgetAmount = targetCategoryIDtoBudgetAmount.get(categoryID) ?? 0;
            const usedAmount = targetCategoryIDtoUsedAmount.get(categoryID) ?? 0;

            const lastBudgetAmount = lastCategoryIDtoBudgetAmount.get(categoryID) ?? 0;
            const lastUsedAmount = lastCategoryIDtoUsedAmount.get(categoryID) ?? 0;
            const carryOverAmount = Math.max(0, lastBudgetAmount - lastUsedAmount);

            balanceResponses.push({ title, budgetAmount, carryOverAmount, usedAmount });
        }

        return Promise.resolve(balanceResponses);
    }

    async propagateLatestBudgetUntilTarget(
        targetYear: number,
        targetMonth: number
    ): Promise<void> {
        const budgetMasterHeaderColIndex = await this.fetchTableHeaderColumnIndex(BudgetMasterFormat.title);

        const budgetColNoHeaderCategoryID = budgetMasterHeaderColIndex[BudgetMasterFormat.headerCategoryID] + 1;
        const budgetColNoHeaderTargetYearMonth = budgetMasterHeaderColIndex[BudgetMasterFormat.headerTargetYearMonth] + 1;
        const budgetColNoHeaderBudgetAmount = budgetMasterHeaderColIndex[BudgetMasterFormat.headerBudgetAmount] + 1;

        if (budgetColNoHeaderCategoryID === undefined ||
            budgetColNoHeaderTargetYearMonth === undefined ||
            budgetColNoHeaderBudgetAmount === undefined) {
            throw new Error("必要なヘッダが存在しません");
        }

        const rowsBudgetOrderByDateAsc = await this.selectTableInPeriodOrderByDateAsc(
            BudgetMasterFormat.title,
            this.columnNoToAlphabet(budgetColNoHeaderTargetYearMonth),
            undefined,
            undefined,
            targetYear,
            targetMonth
        );

        console.log("rowsBudgetOrderByDateAsc", rowsBudgetOrderByDateAsc);

        const categoryIDtoLatestBudget = new Map<number, { year: number, month: number, budgetAmount: number }>();
        for (const row of rowsBudgetOrderByDateAsc) {
            const budgetCategoryID = Number(row[budgetColNoHeaderCategoryID - 1]);
            const budgetAmount = Number(row[budgetColNoHeaderBudgetAmount - 1]);

            const budgetDate = this.parseGvizDate(row[budgetColNoHeaderTargetYearMonth - 1]);
            const budgetYear = budgetDate.getFullYear();
            const budgetMonth = budgetDate.getMonth() + 1;

            categoryIDtoLatestBudget.set(budgetCategoryID, { year: budgetYear, month: budgetMonth, budgetAmount });
        }

        console.log("categoryIDtoLatestBudget", categoryIDtoLatestBudget);
    }
}