import { useEffect, useState } from "react";
import "../App.css";
import PaymentInput from "../ui/PaymentInput";
import BalanceDisplay from "../ui/BalanceDisplay";
import type { SheetOperator, Category, BalanceResponse } from "../SheetOperator";
import LoadingContent from "../ui/LoadingContent";
import YearMonthSelect from "../ui/YearMonthSelect";
import EditCategoryMaster from "../edit_table/EditCategoryMaster";
import EditBudgetDisplayCategoryMaster from "../edit_table/EditBudgetDisplayCategoryMaster";
import EditBudgetMaster from "../edit_table/EditBudgetMaster";
import EditPaymentTable from "../edit_table/EditPaymentTable";

type BudgetPageProps = {
  sheetOperator: SheetOperator;
  onClickDisplaySetting: () => void;
}

function BudgetPage({ sheetOperator, onClickDisplaySetting }: BudgetPageProps) {
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
      <button onClick={onClickDisplaySetting}>表示設定</button>
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
        onChangeAmount={setAmount}
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

  const Phase = {
    BUDGET: 0,
    INPUT: 1,
    MENU: 2,
    EDIT_CATEGORY_MASTER: 3,
    EDIT_BUDGET_DISPLAY_CATEGORY_MASTER: 4,
    EDIT_BUDGET_MASTER: 5,
    EDIT_PAYMENT_TABLE: 6
  }

  const [page, setPage] = useState<number>(Phase.BUDGET);
  const [isPropagateLoading, setIsPropagateLoading] = useState(false);
  const [isEditPhase, setIsEditPhase] = useState(false);
  const [stackPage, setStackPage] = useState<number | undefined>(undefined);

  const handleEnterEditPhase = (phase: number) => {
    setStackPage(page);
    setPage(phase);
    setIsEditPhase(true);
  }

  const handleExitEditPhase = () => {
    setIsEditPhase(false);
    if (stackPage !== undefined) {
      setPage(stackPage);
      setStackPage(undefined);
    }
  }

  useEffect(() => {
    setIsPropagateLoading(true);
    sheetOperator.propagateLatestBudgetUntilTarget(nowYear, nowMonth).finally(() => setIsPropagateLoading(false));
  }, [sheetOperator]);

  if (isPropagateLoading) {
    return <LoadingContent title="予算を更新中" />;
  }

  if (isEditPhase) {
    return (
      <div className="app">
        <main className="main">
          <div>
            {page === Phase.EDIT_CATEGORY_MASTER && <EditCategoryMaster sheetOperator={sheetOperator} />}
            {page === Phase.EDIT_BUDGET_DISPLAY_CATEGORY_MASTER && <EditBudgetDisplayCategoryMaster sheetOperator={sheetOperator} />}
            {page === Phase.EDIT_BUDGET_MASTER && <EditBudgetMaster sheetOperator={sheetOperator} />}
            {page === Phase.EDIT_PAYMENT_TABLE && <EditPaymentTable sheetOperator={sheetOperator} />}
          </div>
          <button onClick={handleExitEditPhase}>戻る</button>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <main className="main">
        {page === Phase.BUDGET && <BudgetPage sheetOperator={sheetOperator} onClickDisplaySetting={() => handleEnterEditPhase(Phase.EDIT_BUDGET_DISPLAY_CATEGORY_MASTER)} />}
        {page === Phase.INPUT && <InputPage sheetOperator={sheetOperator} />}
        {page === Phase.MENU && <Menu onLogout={onLogout} />}
      </main>

      <nav className="menu">
        <button onClick={() => setPage(Phase.BUDGET)}>予算</button>
        <button onClick={() => setPage(Phase.INPUT)}>入力</button>
        <button onClick={() => setPage(Phase.MENU)}>メニュー</button>
      </nav>
    </div>
  );
}
