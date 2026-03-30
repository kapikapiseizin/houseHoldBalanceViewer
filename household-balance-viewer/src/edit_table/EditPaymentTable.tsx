import { useState, useEffect } from "react";
import type { SheetOperator, Payment } from "../SheetOperator";
import YearMonthSelect from "../ui/YearMonthSelect";
import PaymentInput from "../ui/PaymentInput";
import LoadingContent from "../ui/LoadingContent";
import PlainTextItem from "../ui/PlainTextItem";

type EditPaymentTableProps = {
    sheetOperator: SheetOperator;
    onFinish: () => void;
}

export default function EditPaymentTable({ sheetOperator, onFinish }: EditPaymentTableProps) {

    const [phase, setPhase] = useState<"select" | "edit">("select");
    const [paymentID, setPaymentID] = useState<string>("");

    const handlePaymentSelect = (paymentID: string) => {
        setPaymentID(paymentID);
        setPhase("edit");
    }

    const handlePaymentDelete = (paymentID: string) => {
        setPhase("select");
    }

    return (
        <div>
            {phase === "select" && <SelectPaymentTable sheetOperator={sheetOperator} onSelect={handlePaymentSelect} onFinish={onFinish} />}
            {phase === "edit" && <UpdatePaymentTable paymentID={paymentID} sheetOperator={sheetOperator} onDelete={handlePaymentDelete} onFinish={onFinish} />}
        </div>
    );
}

type SelectPaymentTableProps = {
    sheetOperator: SheetOperator;
    onSelect: (paymentID: string) => void;
    onFinish: () => void;
}

function SelectPaymentTable({ sheetOperator, onSelect, onFinish }: SelectPaymentTableProps) {
    const now = new Date();
    const [targetYear, setTargetYear] = useState(now.getFullYear());
    const [targetMonth, setTargetMonth] = useState(now.getMonth() + 1);
    const [isLoading, setIsLoading] = useState(false);
    const [payments, setPayments] = useState<Payment[]>([]);

    const fetchPayments = async () => {
        setIsLoading(true);
        try {
            const payments = await sheetOperator.fetchPaymentsOrderByDateAsc(targetYear, targetMonth);
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

    return (
        <div>
            <h1>決済一覧</h1>
            <YearMonthSelect
                year={targetYear}
                month={targetMonth}
                onChange={(year, month) => { setTargetYear(year); setTargetMonth(month); }}
            />
            {
                payments.map((item, index) => (
                    <div
                        key={index}
                        style={{
                            display: "flex",
                            gap: "8px"
                        }}
                        onClick={() => onSelect(item.paymentID)}
                    >
                        <PlainTextItem data={item.date} />
                        <PlainTextItem data={item.title} />
                        <PlainTextItem data={item.amount.toString()} />
                    </div>
                ))
            }
            <button onClick={onFinish}>完了</button>
        </div>
    );
}

type UpdatePaymentTableProps = {
    paymentID: string;
    sheetOperator: SheetOperator;
    onDelete: (paymentID: string) => void;
    onFinish: () => void;
}

function UpdatePaymentTable({ paymentID, sheetOperator, onDelete, onFinish }: UpdatePaymentTableProps) {
    return (
        <div>
            <h1>決済編集</h1>
            <button onClick={() => onDelete(paymentID)}>削除</button>
            <button onClick={onFinish}>完了</button>
        </div>
    );
}