interface TableFormat {
    readonly title: string;
    readonly headers: string[];
}

interface SheetFormat {
    readonly tables: TableFormat[];
}

const headerCategoryID = "分類ID";
const headerRowNo = "行番号";

export class CategoryMasterFormat {
    static readonly headerCategoryID = headerCategoryID;
    static readonly headerName = "名前";
    static readonly headerRowNo = headerRowNo;
    static readonly title = "分類マスタ";
}

export class BudgetMasterFormat {
    static readonly headerCategoryID = headerCategoryID;
    static readonly headerTargetYearMonth = "対象年月";
    static readonly headerBudgetAmount = "月次予算";
    static readonly headerRowNo = headerRowNo;
    static readonly title = "予算マスタ";
}

export class PaymentTableFormat {
    static readonly headerPaymentID = "決済ID";
    static readonly headerPaymentDate = "決済日";
    static readonly headerTitle = "タイトル";
    static readonly headerCategoryID = headerCategoryID;
    static readonly headerAmount = "金額";
    static readonly headerRowNo = headerRowNo;
    static readonly title = "決済テーブル";
}

export class BudgetDisplayCategoryMasterFormat {
    static readonly headerCategoryID = headerCategoryID;
    static readonly headerDisplayOrder = "昇順上位表示優先度";
    static readonly headerRowNo = headerRowNo;
    static readonly title = "予算表示分類マスタ";
}

export const SHEET_FORMAT: SheetFormat = {
    tables: [
        {
            title: CategoryMasterFormat.title,
            headers: [CategoryMasterFormat.headerCategoryID, CategoryMasterFormat.headerName, CategoryMasterFormat.headerRowNo]
        },
        {
            title: BudgetMasterFormat.title,
            headers: [BudgetMasterFormat.headerCategoryID, BudgetMasterFormat.headerTargetYearMonth, BudgetMasterFormat.headerBudgetAmount, BudgetMasterFormat.headerRowNo]
        },
        {
            title: PaymentTableFormat.title,
            headers: [PaymentTableFormat.headerPaymentID, PaymentTableFormat.headerPaymentDate, PaymentTableFormat.headerTitle, PaymentTableFormat.headerCategoryID, PaymentTableFormat.headerAmount, PaymentTableFormat.headerRowNo]
        },
        {
            title: BudgetDisplayCategoryMasterFormat.title,
            headers: [BudgetDisplayCategoryMasterFormat.headerCategoryID, BudgetDisplayCategoryMasterFormat.headerDisplayOrder, BudgetDisplayCategoryMasterFormat.headerRowNo]
        }
    ]
} as const;