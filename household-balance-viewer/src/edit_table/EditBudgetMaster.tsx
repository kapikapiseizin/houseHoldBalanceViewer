import { useEffect, useState } from "react";
import YearMonthSelect from "../ui/YearMonthSelect";
import type { SheetOperator } from "../SheetOperator";
import LoadingContent from "../ui/LoadingContent";
import PlainTextItem from "../ui/PlainTextItem";
import ToggleTextInput from "../ui/ToggleTextInput";


type EditBudgetMasterProps = {
    sheetOperator: SheetOperator;
    onFinish: () => void;
}

type BudgetCache = {
    categoryID: string;
    categoryName: string;
    budgetAmount: number;
}

export default function EditBudgetMaster({ sheetOperator, onFinish }: EditBudgetMasterProps) {
    const now = new Date();
    const [targetYear, setTargetYear] = useState(now.getFullYear());
    const [targetMonth, setTargetMonth] = useState(now.getMonth() + 1);
    const [isLoading, setIsLoading] = useState(false);
    const [budgets, setBudgets] = useState<BudgetCache[]>([]);

    const fetchBudgets = async () => {
        setIsLoading(true);
        try {
            const categories = await sheetOperator.fetchCategories();
            const budgets = await sheetOperator.fetchBudgets(targetYear, targetMonth);
            const budgetList: BudgetCache[] = [];
            for (const budget of budgets) {
                const category = categories.find((category) => category.categoryID === budget.categoryID);
                if (category) {
                    budgetList.push({
                        categoryID: budget.categoryID,
                        categoryName: category.name,
                        budgetAmount: budget.budgetAmount,
                    });
                }
            }
            setBudgets(budgetList);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBudgets();
    }, [sheetOperator, targetYear, targetMonth]);

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
            {
                budgets.map((item, index) => (
                    <div
                        key={index}
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr auto",
                            gap: "8px",
                            alignItems: "center",
                        }}
                    >
                        <PlainTextItem data={item.categoryName} />
                        <ToggleTextInput
                            value={item.budgetAmount.toString()}
                            onChange={
                                async (newValue) => {
                                    await sheetOperator.updateBudget(targetYear, targetMonth, item.categoryID, parseInt(newValue));
                                    fetchBudgets();
                                }
                            }
                        />
                    </div>
                ))
            }<button onClick={onFinish}>完了</button>
        </div>
    );
}
