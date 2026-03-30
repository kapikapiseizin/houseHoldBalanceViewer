import { useEffect, useState } from "react";
import YearMonthSelect from "../ui/YearMonthSelect";
import type { SheetOperator } from "../SheetOperator";
import LoadingContent from "../ui/LoadingContent";
import PlainTextItem from "../ui/PlainTextItem";
import ToggleInput from "../ui/ToggleInput";
import ListedTextAdd from "../ui/ListedTextAdd";

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
    const [writtenBudgets, setWrittenBudgets] = useState<BudgetCache[]>([]);
    const [unWrittenBudgets, setUnWrittenBudgets] = useState<BudgetCache[]>([]);

    const fetchBudgets = async () => {
        setIsLoading(true);
        try {
            const categories = await sheetOperator.fetchCategories();
            const budgets = await sheetOperator.fetchBudgets(targetYear, targetMonth);
            const writtenBudgetList: BudgetCache[] = [];
            const unWrittenBudgetList: BudgetCache[] = [];
            for (const category of categories) {
                const budget = budgets.find((budget) => budget.categoryID === category.categoryID);
                if (budget) {
                    writtenBudgetList.push({
                        categoryID: category.categoryID,
                        categoryName: category.name,
                        budgetAmount: budget.budgetAmount,
                    });
                } else {
                    unWrittenBudgetList.push({
                        categoryID: category.categoryID,
                        categoryName: category.name,
                        budgetAmount: 0,
                    });
                }
            }
            setWrittenBudgets(writtenBudgetList);
            setUnWrittenBudgets(unWrittenBudgetList);
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
                writtenBudgets.map((item, index) => (
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
                        <ToggleInput
                            inputType="number"
                            value={item.budgetAmount.toString()}
                            onChange={
                                async (newValue) => {
                                    const amount = parseInt(newValue);
                                    if (isNaN(amount)) {
                                        return;
                                    }

                                    setIsLoading(true);
                                    try {
                                        await sheetOperator.updateBudget(targetYear, targetMonth, item.categoryID, amount);
                                    } finally {
                                        setIsLoading(false);
                                    }
                                    fetchBudgets();
                                }
                            }
                        />
                    </div>
                ))
            }
            <ListedTextAdd
                items={unWrittenBudgets.map((item) => {
                    return {
                        id: item.categoryID,
                        text: item.categoryName,
                    }
                })}
                onSelected={async (item) => {
                    setIsLoading(true);
                    try {
                        await sheetOperator.requestAddBudget(targetYear, targetMonth, item.id, 0);
                    } finally {
                        setIsLoading(false);
                    }
                    fetchBudgets();
                }}
            />
            <button onClick={onFinish}>完了</button>
        </div>
    );
}
