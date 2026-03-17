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

export interface SheetOperator {
    fetchCategories(): Promise<Category[]>;
    requestAddPayment(payment: PaymentRequest): Promise<void>;
}