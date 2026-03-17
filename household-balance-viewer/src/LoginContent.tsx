import { useEffect, useState } from "react";
import "./App.css";
import DateInput from "./DateInput";
import TextInput from "./TextInput";
import ListDropdownInput from "./ListDropdownInput";
import MoneyInput from "./MoneyInput";
import BalanceDisplay from "./BalanceDisplay";
import type { SheetOperator, Category, BalanceResponse } from "./SheetOperator";

type BudgetPageProps = {
  sheetOperator: SheetOperator;
}

function BudgetPage({ sheetOperator }: BudgetPageProps) {
  const [balance, setBalance] = useState<BalanceResponse[]>([]);

  useEffect(() => {
    sheetOperator.computeBalance().then(setBalance);
  }, [sheetOperator]);

  return (
    <div className="budget-page">
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
  const [categoryId, setCategoryId] = useState(0);
  const [isTitleManuallyEdited, setIsTitleManuallyEdited] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [amount, setAmount] = useState(0);
  const [dropdownItems, setDropdownItems] = useState<Category[]>([]);

  const selectedCategory = dropdownItems.find(item => item.categoryID === categoryId);
  const defaultTitle = selectedCategory ? selectedCategory.name : "";
  const title = isTitleManuallyEdited ? manualTitle : defaultTitle;

  const handleCategoryChange = (id: number) => {
    console.log("handleCategoryChange", id);
    setCategoryId(id);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsTitleManuallyEdited(true);
    setManualTitle(e.target.value);
  };

  const handleSubmit = async () => {
    await sheetOperator.requestAddPayment({
      date: inputDate,
      categoryID: categoryId,
      title,
      amount
    });

    window.confirm("決済を登録しました");
  };

  useEffect(() => {
    sheetOperator.fetchCategories().then(setDropdownItems);
  }, [sheetOperator]);

  return (
    <div>
      <DateInput title="入力日" date={inputDate} onChange={(e) => setInputDate(e.target.value)} />
      <TextInput
        title="タイトル"
        value={title}
        onChange={handleTitleChange}
      />
      <ListDropdownInput
        title="種類"
        valueId={categoryId}
        items={dropdownItems.map(item => ({ id: item.categoryID, displayName: item.name }))}
        onChange={handleCategoryChange}
      />
      <MoneyInput
        title="金額"
        amount={amount}
        onChange={setAmount}
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
  const [page, setPage] = useState<"budget" | "input" | "menu">("budget");

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
