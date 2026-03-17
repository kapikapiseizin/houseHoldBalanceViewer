export type Category = {
    categoryID: number;
    name: string;
}

export type PaymentRequest = {
    date: string;
    title: string;
    categoryID: number;
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
        targetMonthYear: string
    ): Promise<BalanceResponse[]>;
}