interface TableFormat {
    readonly title: string;
    readonly headers: string[];
}

interface SheetFormat {
    readonly tables: TableFormat[];
}

const headerCategoryID = "分類ID";

export class CategoryMasterFormat {
    static readonly headerCategoryID = headerCategoryID;
    static readonly headerName = "名前";
    static readonly title = "分類マスタ";
}

export class BudgetMasterFormat {
    static readonly headerCategoryID = headerCategoryID;
    static readonly headerTargetYearMonth = "対象年月";
    static readonly headerBudgetAmount = "月次予算";
    static readonly title = "予算マスタ";
}

export class PaymentTableFormat {
    static readonly headerPaymentID = "決済ID";
    static readonly headerPaymentDate = "決済日";
    static readonly headerTitle = "タイトル";
    static readonly headerCategoryID = headerCategoryID;
    static readonly headerAmount = "金額";
    static readonly title = "決済テーブル";
}

export class CarryOverSummaryFormat {
    static readonly headerCategoryID = headerCategoryID;
    static readonly headerMeasurementYearMonth = "計測年月";
    static readonly headerCarryOverAmount = "繰越金額";
    static readonly title = "繰越サマリ";
}

export class BudgetDisplayCategoryMasterFormat {
    static readonly headerCategoryID = headerCategoryID;
    static readonly headerDisplayOrder = "昇順上位表示優先度";
    static readonly title = "予算表示分類マスタ";
}

export const SHEET_FORMAT: SheetFormat = {
    tables: [
        {
            title: CategoryMasterFormat.title,
            headers: [CategoryMasterFormat.headerCategoryID, CategoryMasterFormat.headerName]
        },
        {
            title: BudgetMasterFormat.title,
            headers: [BudgetMasterFormat.headerCategoryID, BudgetMasterFormat.headerTargetYearMonth, BudgetMasterFormat.headerBudgetAmount]
        },
        {
            title: PaymentTableFormat.title,
            headers: [PaymentTableFormat.headerPaymentID, PaymentTableFormat.headerPaymentDate, PaymentTableFormat.headerTitle, PaymentTableFormat.headerCategoryID, PaymentTableFormat.headerAmount]
        },
        {
            title: CarryOverSummaryFormat.title,
            headers: [CarryOverSummaryFormat.headerCategoryID, CarryOverSummaryFormat.headerMeasurementYearMonth, CarryOverSummaryFormat.headerCarryOverAmount]
        },
        {
            title: BudgetDisplayCategoryMasterFormat.title,
            headers: [BudgetDisplayCategoryMasterFormat.headerCategoryID, BudgetDisplayCategoryMasterFormat.headerDisplayOrder]
        }
    ]
} as const;