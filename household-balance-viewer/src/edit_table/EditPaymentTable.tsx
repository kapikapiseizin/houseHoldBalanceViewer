import type { SheetOperator } from "../SheetOperator";

type EditPaymentTableProps = {
    sheetOperator: SheetOperator;
    onFinish: () => void;
}

export default function EditPaymentTable({ sheetOperator, onFinish }: EditPaymentTableProps) {
    return (
        <div>
            <h1>決済一覧</h1>
            <button onClick={onFinish}>完了</button>
        </div>
    );
}