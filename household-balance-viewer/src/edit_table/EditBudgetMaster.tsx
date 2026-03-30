import { useEffect, useState } from "react";
import YearMonthSelect from "../ui/YearMonthSelect";
import type { SheetOperator } from "../SheetOperator";
import LoadingContent from "../ui/LoadingContent";


type EditBudgetMasterProps = {
    sheetOperator: SheetOperator;
    onFinish: () => void;
}

export default function EditBudgetMaster({ sheetOperator, onFinish }: EditBudgetMasterProps) {
    const now = new Date();
    const [targetYear, setTargetYear] = useState(now.getFullYear());
    const [targetMonth, setTargetMonth] = useState(now.getMonth() + 1);
    const [isLoading, setIsLoading] = useState(false);

    if (isLoading) {
        return <LoadingContent title="データを取得中" />;
    }

    return (
        <div>
            <h1>予算マスタ</h1>
            <YearMonthSelect
                year={targetYear}
                month={targetMonth}
                onChange={(year, month) => { setTargetYear(year); setTargetMonth(month); }}
            />
            <button onClick={onFinish}>完了</button>
        </div>
    );
}
