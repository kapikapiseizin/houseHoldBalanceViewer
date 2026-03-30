import type { SheetOperator } from "../SheetOperator";

type EditBudgetMasterProps = {
    sheetOperator: SheetOperator;
    onFinish: () => void;
}

export default function EditBudgetMaster({ sheetOperator, onFinish }: EditBudgetMasterProps) {
    return (
        <div>
            <h1>予算マスタ</h1>
            <button onClick={onFinish}>完了</button>
        </div>
    );
}
