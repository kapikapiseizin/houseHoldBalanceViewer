export type Category = {
    id: number;
    name: string;
}

export interface SheetOperator {
    fetchCategories(): Promise<Category[]>;
}