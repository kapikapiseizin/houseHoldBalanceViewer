import { useEffect, useState } from "react";
import "../App.css";
import PaymentInput from "../ui/PaymentInput";
import BalanceDisplay from "../ui/BalanceDisplay";
import type { SheetOperator, Category, BalanceResponse } from "../SheetOperator";
import LoadingContent from "../ui/LoadingContent";
import YearMonthSelect from "../ui/YearMonthSelect";

type BudgetPageProps = {
  sheetOperator: SheetOperator;
}

function BudgetPage({ sheetOperator }: BudgetPageProps) {
  const now = new Date();
  const [targetYear, setTargetYear] = useState(now.getFullYear());
  const [targetMonth, setTargetMonth] = useState(now.getMonth() + 1);

  const [balance, setBalance] = useState<BalanceResponse[]>([]);
  const [isFetchLoading, setIsFetchLoading] = useState(false);

  useEffect(() => {
    setIsFetchLoading(true);
    sheetOperator.computeBalance(targetYear, targetMonth).then(setBalance).finally(() => setIsFetchLoading(false));
  }, [sheetOperator, targetYear, targetMonth]);

  if (isFetchLoading) {
    return <LoadingContent title="データを取得中" />;
  }

  return (
    <div className="budget-page">
      <YearMonthSelect year={targetYear} month={targetMonth} onChange={(year, month) => { setTargetYear(year); setTargetMonth(month); }} />
      {balance.map((balance, index) => (
        <BalanceDisplay
          key={index}
          title={balance.title}
          budgetAmount={balance.budgetAmount}
          carryOverAmount={balance.carryOverAmount}
          usedAmount={balance.usedAmount}
        />
      ))}
    </div>
  );
}

type InputPageProps = {
  sheetOperator: SheetOperator;
}

function InputPage({ sheetOperator }: InputPageProps) {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const [inputDate, setInputDate] = useState(today);
  const [categoryId, setCategoryId] = useState("");
  const [isTitleManuallyEdited, setIsTitleManuallyEdited] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [amount, setAmount] = useState(0);
  const [dropdownItems, setDropdownItems] = useState<Category[]>([]);
  const [isFetchLoading, setIsFetchLoading] = useState(false);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);

  const selectedCategory = dropdownItems.find(item => item.categoryID === categoryId);
  const defaultTitle = selectedCategory ? selectedCategory.name : "";
  const title = isTitleManuallyEdited ? manualTitle : defaultTitle;

  const handleTitleChange = (title: string) => {
    setIsTitleManuallyEdited(true);
    setManualTitle(title);
  };

  const handleSubmit = async () => {
    setIsSubmitLoading(true);
    try {
      await sheetOperator.requestAddPayment({
        date: inputDate,
        categoryID: categoryId,
        title,
        amount
      });
    } finally {
      setIsSubmitLoading(false);
    }

    window.confirm("決済を登録しました");
  };

  const fetchCategories = async () => {
    setIsFetchLoading(true);
    try {
      const categories = await sheetOperator.fetchCategories();
      setDropdownItems(categories);

      if (categories.length > 0) {
        setCategoryId(categories[0].categoryID);
      }
    } finally {
      setIsFetchLoading(false);
    }
  }

  useEffect(() => {
    fetchCategories();
  }, [sheetOperator]);

  if (isFetchLoading) {
    return <LoadingContent title="データを取得中" />;
  }

  if (isSubmitLoading) {
    return <LoadingContent title="登録中" />;
  }

  return (
    <div>
      <PaymentInput
        inputDate={inputDate}
        onChangeDate={setInputDate}
        title={title}
        onChangeTitle={handleTitleChange}
        categoryId={categoryId}
        dropdownItems={dropdownItems}
        onChangeCategoryID={setCategoryId}
        amount={amount}
        onChanngeAmount={setAmount}
      />
      <button onClick={handleSubmit}>登録</button>
    </div>
  );
}

type MenuProps = {
  onLogout: () => void;
};

function Menu({ onLogout }: MenuProps) {
  return (
    <div>
      <button onClick={onLogout}>Logout</button>
    </div>
  );
}

export type LoginContentProps = {
  sheetOperator: SheetOperator;
  onLogout: () => void;
};

export default function LoginContent({ sheetOperator, onLogout }: LoginContentProps) {
  const now = new Date();
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth() + 1;

  const [page, setPage] = useState<"budget" | "input" | "menu">("budget");
  const [isPropagateLoading, setIsPropagateLoading] = useState(false);

  useEffect(() => {
    setIsPropagateLoading(true);
    sheetOperator.propagateLatestBudgetUntilTarget(nowYear, nowMonth).finally(() => setIsPropagateLoading(false));
  }, [sheetOperator]);

  if (isPropagateLoading) {
    return <LoadingContent title="予算を更新中" />;
  }

  return (
    <div className="app">
      <main className="main">
        {page === "budget" && <BudgetPage sheetOperator={sheetOperator} />}
        {page === "input" && <InputPage sheetOperator={sheetOperator} />}
        {page === "menu" && <Menu onLogout={onLogout} />}
      </main>

      <nav className="menu">
        <button onClick={() => setPage("budget")}>予算</button>
        <button onClick={() => setPage("input")}>入力</button>
        <button onClick={() => setPage("menu")}>メニュー</button>
      </nav>
    </div>
  );
}
