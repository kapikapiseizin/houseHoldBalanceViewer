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

export interface SheetOperator {
    fetchCategories(): Promise<Category[]>;
    requestAddPayment(payment: PaymentRequest): Promise<void>;
    computeBalance(
        targetYear: number,
        targetMonth: number
    ): Promise<BalanceResponse[]>;
    propagateLatestBudgetUntilTarget(
        targetYear: number,
        targetMonth: number
    ): Promise<void>;
}