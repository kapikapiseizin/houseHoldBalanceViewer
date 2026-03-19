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
            headerColIndex: Record<string, number>,
            targetYear: number,
            targetMonth: number
        ) => {
            const tableName = CarryOverSummaryFormat.title;
            const columnNoCategoryID = headerColIndex[CarryOverSummaryFormat.headerCategoryID] + 1;
            const columnNoMeasurementYearMonth = headerColIndex[CarryOverSummaryFormat.headerMeasurementYearMonth] + 1;
            const columnNoCarryOverAmount = headerColIndex[CarryOverSummaryFormat.headerCarryOverAmount] + 1;

            if (
                columnNoCategoryID === undefined ||
                columnNoMeasurementYearMonth === undefined ||
                columnNoCarryOverAmount === undefined
            ) {
                throw new Error("必要なヘッダが存在しません");
            }


            const query = `
                SELECT *
                WHERE ${this.sqlWhereMaxYearMonth(this.columnNoToAlphabet(columnNoMeasurementYearMonth), targetYear, targetMonth)}
                ORDER BY ${this.columnNoToAlphabet(columnNoMeasurementYearMonth)} DESC
            `;

            const res = await this.fetchSheetQuery(tableName, query);

            const rows = await this.getRowsByQueryResponse(res);

            const categoryIDToCarryOverAmount = new Map<number, { measurementYearMonth: Date, carryOverAmount: number }>();
            for (const row of rows) {
                const measurementYearMonth = this.parseGvizDate(row[columnNoMeasurementYearMonth - 1]);
                const categoryID = Number(row[columnNoCategoryID - 1]);
                const carryOverAmount = Number(row[columnNoCarryOverAmount - 1]);

                if (categoryIDToCarryOverAmount.has(categoryID)) {
                    continue;
                }

                categoryIDToCarryOverAmount.set(categoryID, { measurementYearMonth, carryOverAmount });
            }

            return categoryIDToCarryOverAmount;
        }

        const selectTableInPeriodOrderByDateAsc = async (
            tableName: string,
            dateColumn: string,
            startYear: number | undefined = undefined,
            startMonth: number | undefined = undefined,
            endYear: number,
            endMonth: number
        ) => {
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

        const computeUsedAmount = async (
            headerColIndex: Record<string, number>,
            rowsOrderByDateAsc: string[][]
        ) => {
            const columnNoPaymentDate = headerColIndex[PaymentTableFormat.headerPaymentDate] + 1;
            const columnNoCategoryID = headerColIndex[PaymentTableFormat.headerCategoryID] + 1;
            const columnNoAmount = headerColIndex[PaymentTableFormat.headerAmount] + 1;

            if (
                columnNoPaymentDate === undefined ||
                columnNoCategoryID === undefined ||
                columnNoAmount === undefined
            ) {
                throw new Error("必要なヘッダが存在しません");
            }

            const categoryIDtoUsedAmount = new Map<number, number>();
            for (let rowIdx = rowsOrderByDateAsc.length - 1; rowIdx >= 0; rowIdx--) {
                const row = rowsOrderByDateAsc[rowIdx];
                const categoryID = Number(row[columnNoCategoryID - 1]);
                const paymentAmount = Number(row[columnNoAmount - 1]);
                const paymentDate = this.parseGvizDate(row[columnNoPaymentDate - 1]);
                const paymentYear = paymentDate.getFullYear();
                const paymentMonth = paymentDate.getMonth() + 1;

                if (paymentYear < targetYear || (paymentYear === targetYear && paymentMonth < targetMonth)) {
                    break;
                }

                if (paymentYear != targetYear || paymentMonth != targetMonth) {
                    continue;
                }

                const sumAmount = categoryIDtoUsedAmount.get(categoryID);
                if (sumAmount !== undefined) {
                    categoryIDtoUsedAmount.set(categoryID, sumAmount + paymentAmount);
                } else {
                    categoryIDtoUsedAmount.set(categoryID, paymentAmount);
                }
            }

            return categoryIDtoUsedAmount;
        }



        const carrySummeryHeaderColIndex = await this.fetchTableHeaderColumnIndex(CarryOverSummaryFormat.title);

        const budgetDisplayCategories = await fetchBudgetDisplayCategories();

        const { year: lastMonthTargetYear, month: lastMonthTargetMonth } = this.addYearMonth(targetYear, targetMonth, 0, -1);

        const latestSummeryCategoryIDtoCarryOver = await fetchLatestCarryOverSummery(
            carrySummeryHeaderColIndex,
            lastMonthTargetYear,
            lastMonthTargetMonth
        );

        let minSummeryYear: number | undefined = undefined;
        let minSummeryMonth: number | undefined = undefined;
        let startPeriodPaymentYear: number | undefined = undefined;
        let startPeriodPaymentMonth: number | undefined = undefined;
        if (latestSummeryCategoryIDtoCarryOver.size > 0) {
            const minYearMonth = Array.from(latestSummeryCategoryIDtoCarryOver.values())
                .reduce((prev, curr) => {
                    if (prev.measurementYearMonth < curr.measurementYearMonth) {
                        return prev;
                    }
                    return curr;
                });
            minSummeryYear = minYearMonth.measurementYearMonth.getFullYear();
            minSummeryMonth = minYearMonth.measurementYearMonth.getMonth() + 1;
        }

        console.log("minSummeryYear", minSummeryYear);
        console.log("minSummeryMonth", minSummeryMonth);

        if (minSummeryYear !== undefined && minSummeryMonth !== undefined) {
            ({ year: startPeriodPaymentYear, month: startPeriodPaymentMonth } = this.addYearMonth(minSummeryYear, minSummeryMonth, 0, 1));
        }

        console.log("startPeriodPaymentYear", startPeriodPaymentYear);
        console.log("startPeriodPaymentMonth", startPeriodPaymentMonth);

        const paymentHeaderColIndex = await this.fetchTableHeaderColumnIndex(PaymentTableFormat.title);

        const columnNoPaymentDate = paymentHeaderColIndex[PaymentTableFormat.headerPaymentDate] + 1;

        if (columnNoPaymentDate === undefined) {
            throw new Error("決済テーブルに決済日列が存在しません");
        }

        const paymentTableInPeriodOrderByDateAsc = await selectTableInPeriodOrderByDateAsc(
            PaymentTableFormat.title,
            `${this.columnNoToAlphabet(columnNoPaymentDate)}`,
            startPeriodPaymentYear,
            startPeriodPaymentMonth,
            targetYear,
            targetMonth
        );

        console.log("budgetDisplayCategories", budgetDisplayCategories);
        console.log("latestSummeryCategoryIDtoCarryOver", latestSummeryCategoryIDtoCarryOver);
        console.log("paymentTableInPeriodOrderByDateAsc", paymentTableInPeriodOrderByDateAsc);

        const categoryIDtoUsedAmount = await computeUsedAmount(paymentHeaderColIndex, paymentTableInPeriodOrderByDateAsc);
        console.log("categoryIDtoUsedAmount", categoryIDtoUsedAmount);

        const budgetHeaderColIndex = await this.fetchTableHeaderColumnIndex(BudgetMasterFormat.title);

        const columnNoBudgetTargetYearMonth = budgetHeaderColIndex[BudgetMasterFormat.headerTargetYearMonth] + 1;
        if (columnNoBudgetTargetYearMonth === undefined) {
            throw new Error("予算マスタに予算対象年月列が存在しません");
        }

        const budgetTableInPeriodOrderByDateAsc = await selectTableInPeriodOrderByDateAsc(
            BudgetMasterFormat.title,
            `${this.columnNoToAlphabet(columnNoBudgetTargetYearMonth)}`,
            undefined,
            undefined,
            targetYear,
            targetMonth
        );

        console.log("budgetTableInPeriodOrderByDateAsc", budgetTableInPeriodOrderByDateAsc);

        return Promise.resolve([
            { title: "テスト食費", budgetAmount: 50000, carryOverAmount: 10000, usedAmount: 60000 },
            { title: "テスト日用品", budgetAmount: 20000, carryOverAmount: 10000, usedAmount: 15000 },
            { title: "テスト娯楽", budgetAmount: 10000, carryOverAmount: 0, usedAmount: 2000 }
        ]);
    }
}