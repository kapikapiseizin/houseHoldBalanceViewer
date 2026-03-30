import type { Category, PaymentRequest, BalanceResponse, SheetOperator, Budget, Payment } from "./SheetOperator";
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

    async fetchTableNameToSheetID(): Promise<Map<string, number>> {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadSheetID}`;

        const tableNameToSheetID = new Map<string, number>();

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();
            data.sheets.forEach((sheet: any) => {
                tableNameToSheetID.set(sheet.properties.title, sheet.properties.sheetId);
            });

        } catch (error) {
            console.error('Error fetching sheet ID:', error);
        }

        return tableNameToSheetID;
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
                    categoryID: categoryIDStr,
                    name: name
                });
            }
        }

        return categories;
    }

    columnNoToAlphabet = (colNo: number) => String.fromCharCode(64 + colNo);
    readonly rowNoFunction = '=ROW()';

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
    ): Promise<Map<string, number>> {
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

        const idToSumMap: Map<string, number> = new Map();

        rows.forEach((row) => {
            const id = row[0];
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

    async requestAddRowsToTable(tableName: string, rows: string[][]): Promise<void> {
        await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadSheetID}/values/${encodeURIComponent(tableName)}!A1:append?valueInputOption=USER_ENTERED`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    values: rows
                })
            }
        );
    }

    async requestDeleteRow(tableName: string, rowNo: number): Promise<void> {
        const sheetIDtoTableName = await this.fetchTableNameToSheetID();

        const sheetID = sheetIDtoTableName.get(tableName);
        if (sheetID === undefined) {
            throw new Error("シートIDが存在しません");
        }

        const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadSheetID}:batchUpdate`;

        const body = {
            requests: [
                {
                    deleteDimension: {
                        range: {
                            sheetId: sheetID,
                            dimension: "ROWS",
                            startIndex: rowNo - 1,
                            endIndex: rowNo
                        }
                    }
                }
            ]
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error:', errorData);
                return;
            }

            const result = await response.json();
            console.log('Success:', result);
        } catch (error) {
            console.error('Fetch Error:', error);
        }
    }

    async requestUpdateRows(tableName: string, column: string, rowNo: number, rows: string[][]): Promise<void> {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadSheetID}/values/${tableName}!${column}${rowNo}?valueInputOption=USER_ENTERED`;

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                values: rows
            })
        });

        return await response.json();
    }

    async requestAddPayment(payment: PaymentRequest): Promise<void> {
        const sheetName = PaymentTableFormat.title;

        const colIndexMap = await this.fetchTableHeaderColumnIndex(sheetName);

        const idxID = colIndexMap[PaymentTableFormat.headerPaymentID];
        const idxDate = colIndexMap[PaymentTableFormat.headerPaymentDate];
        const idxTitle = colIndexMap[PaymentTableFormat.headerTitle];
        const idxCategory = colIndexMap[PaymentTableFormat.headerCategoryID];
        const idxAmount = colIndexMap[PaymentTableFormat.headerAmount];
        const idxRowNo = colIndexMap[PaymentTableFormat.headerRowNo];

        if (
            idxID === undefined ||
            idxDate === undefined ||
            idxTitle === undefined ||
            idxCategory === undefined ||
            idxAmount === undefined ||
            idxRowNo === undefined
        ) {
            throw new Error("必要なヘッダが存在しません");
        }

        // 4. 行データ作成
        const newRow: string[] = [];

        const paymentID = crypto.randomUUID();

        newRow[idxID] = paymentID;
        newRow[idxDate] = payment.date;
        newRow[idxTitle] = payment.title;
        newRow[idxCategory] = payment.categoryID;
        newRow[idxAmount] = String(payment.amount);
        newRow[idxRowNo] = this.rowNoFunction;

        // 5. 追記
        await this.requestAddRowsToTable(sheetName, [newRow]);
    }

    async fetchPaymentsOrderByDateAsc(year: number, month: number): Promise<Payment[]> {
        const paymentHeaderColIndex = await this.fetchTableHeaderColumnIndex(PaymentTableFormat.title);

        const paymentIDColNo = paymentHeaderColIndex[PaymentTableFormat.headerPaymentID] + 1;
        const dateColNo = paymentHeaderColIndex[PaymentTableFormat.headerPaymentDate] + 1;
        const titleColNo = paymentHeaderColIndex[PaymentTableFormat.headerTitle] + 1;
        const categoryIDColNo = paymentHeaderColIndex[PaymentTableFormat.headerCategoryID] + 1;
        const amountColNo = paymentHeaderColIndex[PaymentTableFormat.headerAmount] + 1;

        if (
            paymentIDColNo === undefined ||
            dateColNo === undefined ||
            titleColNo === undefined ||
            categoryIDColNo === undefined ||
            amountColNo === undefined
        ) {
            throw new Error("必要なヘッダが存在しません");
        }

        const rows = await this.selectTableInPeriodOrderByDateAsc(
            PaymentTableFormat.title,
            this.columnNoToAlphabet(dateColNo),
            year,
            month,
            year,
            month
        );

        const payments: Payment[] = [];

        for (const row of rows) {
            const paymentID = row[paymentIDColNo - 1];

            const date = this.parseGvizDate(row[dateColNo - 1]);
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

            const title = row[titleColNo - 1];
            const categoryID = row[categoryIDColNo - 1];
            const amount = Number(row[amountColNo - 1]);

            payments.push({
                paymentID,
                date: dateStr,
                title,
                categoryID,
                amount
            });
        }

        return payments;
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
            const rows: { categoryID: string; displayOrder: number }[] = [];

            for (let i = 1; i < values.length; i++) {
                const row = values[i];

                const rawCategoryID = row[idxCategoryID];
                const rawDisplayOrder = row[idxDisplayOrder];

                // 空行スキップ
                if (!rawCategoryID || !rawDisplayOrder) continue;

                const categoryID = rawCategoryID;
                const displayOrder = Number(rawDisplayOrder);

                if (isNaN(displayOrder)) continue;

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
        const categoryIDtoName = new Map<string, string>();
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

        const categoryIDtoLatestBudget = new Map<number, { year: number, month: number, budgetAmount: number }>();
        for (const row of rowsBudgetOrderByDateAsc) {
            const budgetCategoryID = Number(row[budgetColNoHeaderCategoryID - 1]);
            const budgetAmount = Number(row[budgetColNoHeaderBudgetAmount - 1]);

            const budgetDate = this.parseGvizDate(row[budgetColNoHeaderTargetYearMonth - 1]);
            const budgetYear = budgetDate.getFullYear();
            const budgetMonth = budgetDate.getMonth() + 1;

            categoryIDtoLatestBudget.set(budgetCategoryID, { year: budgetYear, month: budgetMonth, budgetAmount });
        }

        const rowsToAdd: string[][] = [];

        for (const [categoryID, latestBudget] of categoryIDtoLatestBudget.entries()) {
            if (latestBudget.year === targetYear && latestBudget.month === targetMonth) {
                continue;
            }

            const targetMonthCount = targetYear * 12 + targetMonth;
            const latestMonthCount = latestBudget.year * 12 + latestBudget.month;

            const diffMonthCount = targetMonthCount - latestMonthCount;

            let currentYear = latestBudget.year;
            let currentMonth = latestBudget.month;
            for (let i = 0; i < diffMonthCount; i++) {
                const { year: nextYear, month: nextMonth } = this.addYearMonth(currentYear, currentMonth, 0, 1);
                currentYear = nextYear;
                currentMonth = nextMonth;

                const row = new Array(3);
                row[budgetColNoHeaderCategoryID - 1] = categoryID;
                row[budgetColNoHeaderTargetYearMonth - 1] = `${String(currentYear)}-${String(currentMonth).padStart(2, "0")}`;
                row[budgetColNoHeaderBudgetAmount - 1] = latestBudget.budgetAmount;
                rowsToAdd.push(row);
            }
        }

        if (rowsToAdd.length > 0) {
            await this.requestAddRowsToTable(BudgetMasterFormat.title, rowsToAdd);
        }
    }

    async requestAddCategory(name: string): Promise<void> {
        const categoryMasterHeaderColIndex = await this.fetchTableHeaderColumnIndex(CategoryMasterFormat.title);
        const categoryIDColIndex = categoryMasterHeaderColIndex[CategoryMasterFormat.headerCategoryID];
        const categoryNameColIndex = categoryMasterHeaderColIndex[CategoryMasterFormat.headerName];
        const categoryRowNoColIndex = categoryMasterHeaderColIndex[CategoryMasterFormat.headerRowNo];

        if (categoryIDColIndex === undefined ||
            categoryNameColIndex === undefined ||
            categoryRowNoColIndex === undefined) {
            throw new Error("必要なヘッダが存在しません");
        }

        const row = [];
        row[categoryIDColIndex] = crypto.randomUUID();
        row[categoryNameColIndex] = name;
        row[categoryRowNoColIndex] = this.rowNoFunction;
        await this.requestAddRowsToTable(CategoryMasterFormat.title, [row]);
    }

    async requestDeleteCategory(categoryID: string): Promise<void> {
        console.log(`requestDeleteCategory: ${categoryID}`);

        const categoryMasterHeaderColIndex = await this.fetchTableHeaderColumnIndex(CategoryMasterFormat.title);
        const categoryIDColNo = categoryMasterHeaderColIndex[CategoryMasterFormat.headerCategoryID] + 1;
        const categoryRowNoColNo = categoryMasterHeaderColIndex[CategoryMasterFormat.headerRowNo] + 1;

        if (categoryIDColNo === undefined ||
            categoryRowNoColNo === undefined ||
            categoryRowNoColNo === undefined) {
            throw new Error("必要なヘッダが存在しません");
        }

        const findIDQuery = `SELECT ${this.columnNoToAlphabet(categoryRowNoColNo)} WHERE ${this.columnNoToAlphabet(categoryIDColNo)} = '${encodeURIComponent(categoryID)}'`;
        const findIDResponse = await this.fetchSheetQuery(CategoryMasterFormat.title, findIDQuery);
        const findIDRows = await this.getRowsByQueryResponse(findIDResponse);

        if (findIDRows.length !== 1) {
            throw new Error("カテゴリIDが存在しません");
        }

        await this.requestDeleteRow(CategoryMasterFormat.title, Number(findIDRows[0][0]));
    }

    async updateCategory({ categoryID, name }: Category): Promise<void> {
        const categoryMasterHeaderColIndex = await this.fetchTableHeaderColumnIndex(CategoryMasterFormat.title);
        const categoryIDColNo = categoryMasterHeaderColIndex[CategoryMasterFormat.headerCategoryID] + 1;
        const categoryNameColNo = categoryMasterHeaderColIndex[CategoryMasterFormat.headerName] + 1;
        const categoryRowNoColNo = categoryMasterHeaderColIndex[CategoryMasterFormat.headerRowNo] + 1;

        if (categoryIDColNo === undefined ||
            categoryNameColNo === undefined ||
            categoryRowNoColNo === undefined) {
            throw new Error("必要なヘッダが存在しません");
        }

        const findIDQuery = `SELECT ${this.columnNoToAlphabet(categoryRowNoColNo)} WHERE ${this.columnNoToAlphabet(categoryIDColNo)} = '${encodeURIComponent(categoryID)}'`;
        const findIDResponse = await this.fetchSheetQuery(CategoryMasterFormat.title, findIDQuery);
        const findIDRows = await this.getRowsByQueryResponse(findIDResponse);

        if (findIDRows.length !== 1) {
            throw new Error("カテゴリIDが存在しません");
        }

        await this.requestUpdateRows(CategoryMasterFormat.title, this.columnNoToAlphabet(categoryNameColNo), Number(findIDRows[0][0]), [[name]]);
    }

    async fetchOrderedBudgetDisplayCategoryIDs(): Promise<string[]> {
        const budgetDisplayHeaderColIndex = await this.fetchTableHeaderColumnIndex(BudgetDisplayCategoryMasterFormat.title);
        const categoryIDColNo = budgetDisplayHeaderColIndex[BudgetDisplayCategoryMasterFormat.headerCategoryID] + 1;
        const orderColNo = budgetDisplayHeaderColIndex[BudgetDisplayCategoryMasterFormat.headerDisplayOrder] + 1;

        if (categoryIDColNo === undefined || orderColNo === undefined) {
            throw new Error("必要なヘッダが存在しません");
        }

        const query = `
            SELECT ${this.columnNoToAlphabet(categoryIDColNo)} 
            ORDER BY ${this.columnNoToAlphabet(orderColNo)} ASC`;
        const response = await this.fetchSheetQuery(BudgetDisplayCategoryMasterFormat.title, query);
        const rows = await this.getRowsByQueryResponse(response);

        return rows.map((row) => row[0]);
    }

    async updateOrderedBudgetDisplayCategories(categoryIDs: string[]): Promise<void> {
        const budgetDisplayHeaderColIndex = await this.fetchTableHeaderColumnIndex(BudgetDisplayCategoryMasterFormat.title);
        const categoryIDColIndex = budgetDisplayHeaderColIndex[BudgetDisplayCategoryMasterFormat.headerCategoryID];
        const orderColIndex = budgetDisplayHeaderColIndex[BudgetDisplayCategoryMasterFormat.headerDisplayOrder];

        if (categoryIDColIndex === undefined || orderColIndex === undefined) {
            throw new Error("必要なヘッダが存在しません");
        }

        const rows: string[][] = [];
        for (const categoryID of categoryIDs) {
            const row = new Array(2);
            row[categoryIDColIndex] = categoryID;
            row[orderColIndex] = (rows.length).toString();
            rows.push(row);
        }

        await this.requestUpdateRows(
            BudgetDisplayCategoryMasterFormat.title,
            "A",
            2,
            rows
        );
    }

    async requestAddDisplayBudget(categoryID: string): Promise<void> {
        const budgetDisplayHeaderColIndex = await this.fetchTableHeaderColumnIndex(BudgetDisplayCategoryMasterFormat.title);
        const categoryIDColIndex = budgetDisplayHeaderColIndex[BudgetDisplayCategoryMasterFormat.headerCategoryID];
        const orderColIndex = budgetDisplayHeaderColIndex[BudgetDisplayCategoryMasterFormat.headerDisplayOrder];
        const rowNoColIndex = budgetDisplayHeaderColIndex[BudgetDisplayCategoryMasterFormat.headerRowNo];

        if (categoryIDColIndex === undefined || orderColIndex === undefined || rowNoColIndex === undefined) {
            throw new Error("必要なヘッダが存在しません");
        }

        const maxOrderQuery = `
        SELECT MAX(${this.columnNoToAlphabet(orderColIndex + 1)})
        `;
        const maxOrderResponse = await this.fetchSheetQuery(BudgetDisplayCategoryMasterFormat.title, maxOrderQuery);
        const maxOrderRows = await this.getRowsByQueryResponse(maxOrderResponse);
        const maxOrder = maxOrderRows.length > 0 ? Number(maxOrderRows[0][0]) : 0;

        const row = new Array(2);
        row[categoryIDColIndex] = categoryID;
        row[orderColIndex] = (maxOrder + 1).toString();
        row[rowNoColIndex] = this.rowNoFunction;
        await this.requestAddRowsToTable(BudgetDisplayCategoryMasterFormat.title, [row]);
    }

    async requestDeleteDisplayBudget(categoryID: string): Promise<void> {
        const budgetDisplayHeaderColIndex = await this.fetchTableHeaderColumnIndex(BudgetDisplayCategoryMasterFormat.title);
        const categoryIDColNo = budgetDisplayHeaderColIndex[BudgetDisplayCategoryMasterFormat.headerCategoryID] + 1;
        const rowNoColNo = budgetDisplayHeaderColIndex[BudgetDisplayCategoryMasterFormat.headerRowNo] + 1;

        if (categoryIDColNo === undefined || rowNoColNo === undefined) {
            throw new Error("必要なヘッダが存在しません");
        }

        const findIDQuery = `
        SELECT ${this.columnNoToAlphabet(rowNoColNo)}
        WHERE ${this.columnNoToAlphabet(categoryIDColNo)} = '${encodeURIComponent(categoryID)}'
        `;
        const findIDResponse = await this.fetchSheetQuery(BudgetDisplayCategoryMasterFormat.title, findIDQuery);
        const findIDRows = await this.getRowsByQueryResponse(findIDResponse);

        if (findIDRows.length !== 1) {
            throw new Error("カテゴリIDが存在しません");
        }

        await this.requestDeleteRow(BudgetDisplayCategoryMasterFormat.title, Number(findIDRows[0][0]));
    }

    async fetchBudgets(year: number, month: number): Promise<Budget[]> {
        const budgetHeaderColIndex = await this.fetchTableHeaderColumnIndex(BudgetMasterFormat.title);
        const categoryIDColNo = budgetHeaderColIndex[BudgetMasterFormat.headerCategoryID] + 1;
        const dateColNo = budgetHeaderColIndex[BudgetMasterFormat.headerTargetYearMonth] + 1;
        const budgetAmountColNo = budgetHeaderColIndex[BudgetMasterFormat.headerBudgetAmount] + 1;

        if (categoryIDColNo === undefined || dateColNo === undefined || budgetAmountColNo === undefined) {
            throw new Error("必要なヘッダが存在しません");
        }

        const rowInPeriod = await this.selectTableInPeriodOrderByDateAsc(
            BudgetMasterFormat.title,
            this.columnNoToAlphabet(dateColNo),
            year,
            month,
            year,
            month
        );

        const budgets: Budget[] = [];
        for (const row of rowInPeriod) {
            budgets.push({
                categoryID: row[categoryIDColNo - 1],
                budgetAmount: Number(row[budgetAmountColNo - 1])
            });
        }

        return budgets;
    }

    async updateBudget(year: number, month: number, categoryID: string, budgetAmount: number): Promise<void> {
        const budgetHeaderColIndex = await this.fetchTableHeaderColumnIndex(BudgetMasterFormat.title);
        const categoryIDColNo = budgetHeaderColIndex[BudgetMasterFormat.headerCategoryID] + 1;
        const dateColNo = budgetHeaderColIndex[BudgetMasterFormat.headerTargetYearMonth] + 1;
        const budgetAmountColNo = budgetHeaderColIndex[BudgetMasterFormat.headerBudgetAmount] + 1;
        const rowNoColNo = budgetHeaderColIndex[BudgetMasterFormat.headerRowNo] + 1;

        if (categoryIDColNo === undefined ||
            dateColNo === undefined ||
            budgetAmountColNo === undefined ||
            rowNoColNo === undefined) {
            throw new Error("必要なヘッダが存在しません");
        }

        const findIDQuery = `
        SELECT ${this.columnNoToAlphabet(rowNoColNo)}
        WHERE ${this.columnNoToAlphabet(categoryIDColNo)} = '${encodeURIComponent(categoryID)}'
        AND ${this.sqlWhereMinYearMonth(this.columnNoToAlphabet(dateColNo), year, month)}
        AND ${this.sqlWhereMaxYearMonth(this.columnNoToAlphabet(dateColNo), year, month)}
        `;
        const findIDResponse = await this.fetchSheetQuery(BudgetMasterFormat.title, findIDQuery);
        const findIDRows = await this.getRowsByQueryResponse(findIDResponse);

        if (findIDRows.length !== 1) {
            throw new Error("予算が存在しません");
        }

        await this.requestUpdateRows(BudgetMasterFormat.title, this.columnNoToAlphabet(budgetAmountColNo), Number(findIDRows[0][0]), [[budgetAmount.toString()]]);
    }

    async requestAddBudget(year: number, month: number, categoryID: string, budgetAmount: number): Promise<void> {
        const budgetHeaderColIndex = await this.fetchTableHeaderColumnIndex(BudgetMasterFormat.title);
        const categoryIDColIndex = budgetHeaderColIndex[BudgetMasterFormat.headerCategoryID];
        const dateColIndex = budgetHeaderColIndex[BudgetMasterFormat.headerTargetYearMonth];
        const budgetAmountColIndex = budgetHeaderColIndex[BudgetMasterFormat.headerBudgetAmount];
        const rowNoColIndex = budgetHeaderColIndex[BudgetMasterFormat.headerRowNo];

        if (categoryIDColIndex === undefined ||
            dateColIndex === undefined ||
            budgetAmountColIndex === undefined ||
            rowNoColIndex === undefined) {
            throw new Error("必要なヘッダが存在しません");
        }

        const row = new Array(4);
        row[categoryIDColIndex] = categoryID;
        row[dateColIndex] = `${year}-${month.toString().padStart(2, '0')}`;
        row[budgetAmountColIndex] = budgetAmount.toString();
        row[rowNoColIndex] = this.rowNoFunction;
        await this.requestAddRowsToTable(BudgetMasterFormat.title, [row]);
    }
}