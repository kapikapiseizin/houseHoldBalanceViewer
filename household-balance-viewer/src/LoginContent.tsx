import { useState } from "react";
import "./App.css";
import DateInput from "./DateInput";
import TextInput from "./TextInput";
import ListDropdownInput from "./ListDropdownInput";
import MoneyInput from "./MoneyInput";
import BalanceDisplay from "./BalanceDisplay";
import type { SheetOperator } from "./SheetOperator";

function BudgetPage() {
  return (
    <div className="budget-page">
      <BalanceDisplay
        title="食費"
        budgetAmount={50000}
        carryOverAmount={10000}
        usedAmount={25000}
      />
      <BalanceDisplay
        title="日用品"
        budgetAmount={20000}
        carryOverAmount={0}
        usedAmount={5000}
      />
    </div>
  );
}



function InputPage() {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const dropdownItems = [
    { id: 0, displayName: "食費" },
    { id: 1, displayName: "日用品" },
    { id: 2, displayName: "娯楽" }
  ];

  const [categoryId, setCategoryId] = useState(0);
  const [isTitleManuallyEdited, setIsTitleManuallyEdited] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [amount, setAmount] = useState(0);

  const selectedCategory = dropdownItems.find(item => item.id === categoryId);
  const defaultTitle = selectedCategory ? selectedCategory.displayName : "";
  const title = isTitleManuallyEdited ? manualTitle : defaultTitle;

  const handleCategoryChange = (id: number) => {
    setCategoryId(id);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsTitleManuallyEdited(true);
    setManualTitle(e.target.value);
  };

  const handleSubmit = () => {
    console.log({
      date: today,
      categoryId,
      title,
      amount
    });
  };

  return (
    <div>
      <DateInput title="入力日" date={today} />
      <TextInput
        title="タイトル"
        value={title}
        onChange={handleTitleChange}
      />
      <ListDropdownInput
        title="種類"
        valueId={categoryId}
        items={dropdownItems}
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
        {page === "budget" && <BudgetPage />}
        {page === "input" && <InputPage />}
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
