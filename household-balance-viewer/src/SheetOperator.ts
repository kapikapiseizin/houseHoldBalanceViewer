export type Category = {
    categoryID: string;
    name: string;
}

export type PaymentRequest = {
    date: string;
    title: string;
    categoryID: string;
    amount: number;
}

export type BalanceResponse = {
    title: string;
    budgetAmount: number;
    carryOverAmount: number;
    usedAmount: number;
}

export type Budget = {
    categoryID: string;
    budgetAmount: number;
}

export interface SheetOperator {
    fetchCategories(): Promise<Category[]>;
    requestAddCategory(name: string): Promise<void>;
    requestDeleteCategory(categoryID: string): Promise<void>;
    requestAddPayment(payment: PaymentRequest): Promise<void>;
    computeBalance(
        targetYear: number,
        targetMonth: number
    ): Promise<BalanceResponse[]>;
    propagateLatestBudgetUntilTarget(
        targetYear: number,
        targetMonth: number
    ): Promise<void>;
    updateCategory(category: Category): Promise<void>;
    fetchOrderedBudgetDisplayCategoryIDs(): Promise<string[]>;
    updateOrderedBudgetDisplayCategories(categoryIDs: string[]): Promise<void>;
    requestAddDisplayBudget(categoryID: string): Promise<void>;
    requestDeleteDisplayBudget(categoryID: string): Promise<void>;
    fetchBudgets(year: number, month: number): Promise<Budget[]>;
    updateBudget(year: number, month: number, categoryID: string, budgetAmount: number): Promise<void>;
    requestAddBudget(year: number, month: number, categoryID: string, budgetAmount: number): Promise<void>;
}