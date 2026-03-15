import { useState } from "react";
import "./App.css";

type BalanceDisplayProps = {
  title: string;
  budgetAmount: number;
  carryOverAmount: number;
  usedAmount: number;
};

function BalanceDisplay({ title, budgetAmount, carryOverAmount, usedAmount }: BalanceDisplayProps) {
  const totalAmount = budgetAmount + carryOverAmount;
  const remainingAmount = totalAmount - usedAmount;

  const usedPercent = totalAmount > 0 ? (usedAmount / totalAmount) * 100 : 0;
  const carryOverPercent = totalAmount > 0 ? (carryOverAmount / totalAmount) * 100 : 0;

  return (
    <div className="balance-display">
      <div className="balance-title">{title}</div>
      <div className="balance-text">
        残高 {remainingAmount}円 / {budgetAmount}円 + <span className="carryover-text">{carryOverAmount}円</span>
      </div>
      <div className="balance-bar">
        <div className="bar-used" style={{ width: `${usedPercent}%` }}></div>
        <div className="bar-remaining"></div>
        <div className="bar-carryover" style={{ width: `${carryOverPercent}%` }}></div>
      </div>
    </div>
  );
}

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

type DateInputProps = {
  title: string;
  date: string;
};

function DateInput({ title, date }: DateInputProps) {
  return (
    <div>
      <div>{title}</div>
      <input type="date" defaultValue={date} />
    </div>
  );
}

type TextInputProps = {
  title: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

function TextInput({ title, value, onChange }: TextInputProps) {
  return (
    <div>
      <div>{title}</div>
      <input type="text" value={value} onChange={onChange} />
    </div>
  );
}

type ListDropdownInputProps = {
  title: string;
  valueId: number;
  items: { id: number; displayName: string }[];
  onChange: (id: number, displayName: string) => void;
};

function ListDropdownInput({ title, valueId, items, onChange }: ListDropdownInputProps) {
  return (
    <div>
      <div>{title}</div>
      <select
        value={valueId}
        onChange={(e) => {
          const id = Number(e.target.value);
          const item = items.find(i => i.id === id);
          if (item) {
            onChange(id, item.displayName);
          }
        }}
      >
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.displayName}
          </option>
        ))}
      </select>
    </div>
  );
}

type MoneyInputProps = {
  title: string;
  amount: number;
  onChange: (amount: number) => void;
};

function MoneyInput({ title, amount, onChange }: MoneyInputProps) {
  return (
    <div>
      <div>{title}</div>
      <input 
        type="number" 
        value={amount} 
        onChange={(e) => onChange(Number(e.target.value))} 
      />円
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

export default function App() {
  const [page, setPage] = useState<"budget" | "input">("budget");

  return (
    <div className="app">
      <main className="main">
        {page === "budget" && <BudgetPage />}
        {page === "input" && <InputPage />}
      </main>

      <nav className="menu">
        <button onClick={() => setPage("budget")}>予算</button>
        <button onClick={() => setPage("input")}>入力</button>
      </nav>
    </div>
  );
}
