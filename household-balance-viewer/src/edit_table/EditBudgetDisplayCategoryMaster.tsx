import type { SheetOperator } from "../SheetOperator";

type EditBudgetDisplayCategoryMasterProps = {
    sheetOperator: SheetOperator;
    onFinish: () => void;
}

export default function EditBudgetDisplayCategoryMaster({ }: EditBudgetDisplayCategoryMasterProps) {
    return (
        <div>
            <h1>予算の表示設定</h1>

        </div>
    );
}