import { useState, useEffect } from "react";
import type { SheetOperator, Payment, Category } from "../SheetOperator";
import YearMonthSelect from "../ui/YearMonthSelect";
import PaymentInput from "../ui/PaymentInput";
import LoadingContent from "../ui/LoadingContent";
import PlainTextItem from "../ui/PlainTextItem";
import { headerStyle } from "../ui/HeaderStyle";

type EditPaymentTableProps = {
  sheetOperator: SheetOperator;
  onEnterTableUpdateUI?: () => void;
  onExitTableUpdateUI?: () => void;
};

export default function EditPaymentTable({
  sheetOperator,
  onEnterTableUpdateUI = () => {},
  onExitTableUpdateUI = () => {},
}: EditPaymentTableProps) {
  const [phase, setPhase] = useState<"select" | "edit">("select");
  const [payment, setPayment] = useState<Payment | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const handlePaymentSelect = (payment: Payment) => {
    console.log("handlePaymentSelect:", payment);
    setPayment(payment);
    onEnterTableUpdateUI();
    setPhase("edit");
  };

  const handleRequestPaymentDelete = async (paymentID: string) => {
    if (!window.confirm("本当に削除しますか？")) {
      return;
    }

    setIsLoading(true);
    try {
      await sheetOperator.requestDeletePayment(paymentID);
      setPayment(undefined);
      onExitTableUpdateUI();
      setPhase("select");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackSelect = () => {
    setPayment(undefined);
    onExitTableUpdateUI();
    setPhase("select");
  };

  const handleUpdatePayment = async (payment: Payment) => {
    setIsLoading(true);
    try {
      await sheetOperator.updatePayment(payment);
      setPayment(payment);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const categories = await sheetOperator.fetchCategories();
      setCategories(categories);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [sheetOperator]);

  if (isLoading) {
    return <LoadingContent title="データを取得中" />;
  }

  return (
    <div>
      {phase === "select" && (
        <SelectPaymentTable
          sheetOperator={sheetOperator}
          onSelect={handlePaymentSelect}
        />
      )}
      {phase === "edit" && payment && (
        <UpdatePaymentTable
          payment={payment}
          categories={categories}
          onRequestDelete={handleRequestPaymentDelete}
          onBackSelect={handleBackSelect}
          onUpdatePayment={handleUpdatePayment}
        />
      )}
    </div>
  );
}

type SelectPaymentTableProps = {
  sheetOperator: SheetOperator;
  onSelect: (payment: Payment) => void;
};

function SelectPaymentTable({
  sheetOperator,
  onSelect,
}: SelectPaymentTableProps) {
  const now = new Date();
  const [targetYear, setTargetYear] = useState(now.getFullYear());
  const [targetMonth, setTargetMonth] = useState(now.getMonth() + 1);
  const [isLoading, setIsLoading] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const payments = await sheetOperator.fetchPaymentsOrderByDateAsc(
        targetYear,
        targetMonth,
      );
      setPayments(payments);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [sheetOperator, targetYear, targetMonth]);

  if (isLoading) {
    return <LoadingContent title="データを取得中" />;
  }

  const stylePaymentRow = {
    display: "flex",
    gap: "8px",
    backgroundColor: "#FFF",
    borderRadius: "10px",
    border: "none",
    padding: "6px",
    justifyContent: "space-between",
    alignItems: "center",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: "1",
      }}
    >
      <div style={headerStyle}>決済一覧</div>
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
        {payments.map((item, index) => (
          <div
            key={index}
            style={stylePaymentRow}
            onClick={() => onSelect(item)}
          >
            <PlainTextItem data={item.date} />
            <PlainTextItem data={item.title} />
            <PlainTextItem data={item.amount.toString()} />
          </div>
        ))}
      </div>
    </div>
  );
}

type UpdatePaymentTableProps = {
  payment: Payment;
  categories: Category[];
  onRequestDelete: (paymentID: string) => void;
  onBackSelect: () => void;
  onUpdatePayment: (payment: Payment) => void;
};

function UpdatePaymentTable({
  payment,
  categories,
  onRequestDelete,
  onBackSelect,
  onUpdatePayment,
}: UpdatePaymentTableProps) {
  const [inputDate, setInputDate] = useState(payment.date);
  const [categoryId, setCategoryId] = useState(payment.categoryID);
  const [manualTitle, setManualTitle] = useState(payment.title);
  const [amount, setAmount] = useState(payment.amount);

  const handleFinishEdit = () => {
    onUpdatePayment({
      paymentID: payment.paymentID,
      date: inputDate,
      categoryID: categoryId,
      title: manualTitle,
      amount: amount,
    });
  };

  const styleButton: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    padding: "10px",
    gap: "1px",
    width: "50px",
    height: "50px",
    margin: "10px",
  } as const;

  return (
    <div>
      <div style={headerStyle}>決済編集</div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <button
          onClick={() => onBackSelect()}
          style={{
            ...styleButton,
            backgroundColor: "#5FBDFF",
          }}
        >
          <img
            style={{
              width: "70%",
              height: "70%",
            }}
            src="./back_white.png"
            alt="back"
          />
          <span
            style={{
              fontSize: "0.8rem",
              color: "#FFF",
              marginTop: "4px",
            }}
          >
            戻る
          </span>
        </button>
        <button
          onClick={() => onRequestDelete(payment.paymentID)}
          style={styleButton}
        >
          <img
            style={{
              width: "90%",
              height: "90%",
            }}
            src="./delete.png"
            alt="delete"
          />
          <span
            style={{
              fontSize: "0.8rem",
              color: "#656565",
              marginTop: "4px",
            }}
          >
            削除
          </span>
        </button>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <PaymentInput
          inputDate={inputDate}
          onChangeDate={setInputDate}
          title={manualTitle}
          onChangeTitle={setManualTitle}
          categoryId={categoryId}
          dropdownItems={categories}
          onChangeCategoryID={setCategoryId}
          amount={amount}
          onChangeAmount={setAmount}
          onFinishEdit={handleFinishEdit}
        />
      </div>
    </div>
  );
}
