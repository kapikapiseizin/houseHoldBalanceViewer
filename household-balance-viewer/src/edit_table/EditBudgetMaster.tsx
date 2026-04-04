import { useEffect, useState } from "react";
import YearMonthSelect from "../ui/YearMonthSelect";
import type { SheetOperator } from "../SheetOperator";
import LoadingContent from "../ui/LoadingContent";
import PlainTextItem from "../ui/PlainTextItem";
import ToggleInput from "../ui/ToggleInput";
import ListedTextAdd from "../ui/ListedTextAdd";
import { headerStyle } from "../ui/HeaderStyle";

type EditBudgetMasterProps = {
  sheetOperator: SheetOperator;
};

type BudgetCache = {
  categoryID: string;
  categoryName: string;
  budgetAmount: number;
};

export default function EditBudgetMaster({
  sheetOperator,
}: EditBudgetMasterProps) {
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
        const budget = budgets.find(
          (budget) => budget.categoryID === category.categoryID,
        );
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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: "1",
      }}
    >
      <div style={headerStyle}>予算マスタ</div>
      <YearMonthSelect
        year={targetYear}
        month={targetMonth}
        onChange={(year, month) => {
          setTargetYear(year);
          setTargetMonth(month);
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          padding: "8px",
        }}
      >
        {writtenBudgets.map((item, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              gap: "8px",
              backgroundColor: "#FFF",
              borderRadius: "10px",
              border: "none",
              padding: "6px",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <PlainTextItem data={item.categoryName} />
            <ToggleInput
              inputType="number"
              value={item.budgetAmount.toString()}
              onChange={async (newValue) => {
                const amount = parseInt(newValue);
                if (isNaN(amount)) {
                  return;
                }

                setIsLoading(true);
                try {
                  await sheetOperator.updateBudget(
                    targetYear,
                    targetMonth,
                    item.categoryID,
                    amount,
                  );
                } finally {
                  setIsLoading(false);
                }
                fetchBudgets();
              }}
            />
          </div>
        ))}
      </div>
      <ListedTextAdd
        items={unWrittenBudgets.map((item) => {
          return {
            id: item.categoryID,
            text: item.categoryName,
          };
        })}
        onSelected={async (item) => {
          setIsLoading(true);
          try {
            await sheetOperator.requestAddBudget(
              targetYear,
              targetMonth,
              item.id,
              0,
            );
          } finally {
            setIsLoading(false);
          }
          fetchBudgets();
        }}
      />
    </div>
  );
}
