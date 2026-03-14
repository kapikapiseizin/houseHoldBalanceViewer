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

function InputPage() {
  return <div>入力ページ</div>;
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
