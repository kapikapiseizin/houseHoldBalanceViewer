import { useState, useEffect } from "react";
import type { SheetOperator, Payment, Category } from "../SheetOperator";
import YearMonthSelect from "../ui/YearMonthSelect";
import PaymentInput from "../ui/PaymentInput";
import LoadingContent from "../ui/LoadingContent";
import PlainTextItem from "../ui/PlainTextItem";

type EditPaymentTableProps = {
    sheetOperator: SheetOperator;
}

export default function EditPaymentTable({ sheetOperator }: EditPaymentTableProps) {

    const [phase, setPhase] = useState<"select" | "edit">("select");
    const [payment, setPayment] = useState<Payment | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);

    const handlePaymentSelect = (payment: Payment) => {
        setPayment(payment);
        setPhase("edit");
    }

    const handleRequestPaymentDelete = async (paymentID: string) => {
        if (!window.confirm("本当に削除しますか？")) {
            return;
        }

        setIsLoading(true);
        try {
            await sheetOperator.requestDeletePayment(paymentID);
            setPayment(undefined);
            setPhase("select");
        } finally {
            setIsLoading(false);
        }
    }

    const handleBackSelect = () => {
        setPayment(undefined);
        setPhase("select");
    }

    const handleRequestSetDate = (date: string) => {
    }

    const handleRequestSetTitle = (title: string) => {
    }

    const handleRequestSetCategoryID = (categoryID: string) => {
    }

    const handleRequestSetAmount = (amount: number) => {
    }

    const fetchCategories = async () => {
        setIsLoading(true);
        try {
            const categories = await sheetOperator.fetchCategories();
            setCategories(categories);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchCategories();
    }, [sheetOperator]);

    if (isLoading) {
        return <LoadingContent title="データを取得中" />;
    }

    return (
        <div>
            {phase === "select" && <SelectPaymentTable sheetOperator={sheetOperator} onSelect={handlePaymentSelect} />}
            {phase === "edit" &&
                payment &&
                <UpdatePaymentTable
                    payment={payment}
                    categories={categories}
                    onRequestDelete={handleRequestPaymentDelete}
                    onBackSelect={handleBackSelect}
                    onRequestSetDate={handleRequestSetDate}
                    onRequestSetTitle={handleRequestSetTitle}
                    onRequestSetCategoryID={handleRequestSetCategoryID}
                    onRequestSetAmount={handleRequestSetAmount}
                />
            }
        </div>
    );
}

type SelectPaymentTableProps = {
    sheetOperator: SheetOperator;
    onSelect: (payment: Payment) => void;
}

function SelectPaymentTable({ sheetOperator, onSelect }: SelectPaymentTableProps) {
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
                        onClick={() => onSelect(item)}
                    >
                        <PlainTextItem data={item.date} />
                        <PlainTextItem data={item.title} />
                        <PlainTextItem data={item.amount.toString()} />
                    </div>
                ))
            }
        </div>
    );
}

type UpdatePaymentTableProps = {
    payment: Payment;
    categories: Category[];
    onRequestDelete: (paymentID: string) => void;
    onBackSelect: () => void;
    onRequestSetDate: (date: string) => void;
    onRequestSetTitle: (title: string) => void;
    onRequestSetCategoryID: (categoryID: string) => void;
    onRequestSetAmount: (amount: number) => void;
}

function UpdatePaymentTable({
    payment,
    categories,
    onRequestDelete,
    onBackSelect,
    onRequestSetDate,
    onRequestSetTitle,
    onRequestSetCategoryID,
    onRequestSetAmount
}: UpdatePaymentTableProps) {

    return (
        <div>
            <h1>決済編集</h1>
            <button onClick={() => onRequestDelete(payment.paymentID)}>削除</button>
            <button onClick={() => onBackSelect()}>一覧に戻る</button>
            <PaymentInput
                inputDate={payment.date}
                onChangeDate={onRequestSetDate}
                title={payment.title}
                onChangeTitle={onRequestSetTitle}
                categoryId={payment.categoryID}
                dropdownItems={categories}
                onChangeCategoryID={onRequestSetCategoryID}
                amount={payment.amount}
                onChanngeAmount={onRequestSetAmount}
            />
        </div>
    );
}