import { useState, useEffect } from "react";
import type { SheetOperator } from "../SheetOperator";

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

function SelectPaymentTable({ onFinish }: SelectPaymentTableProps) {
    return (
        <div>
            <h1>決済一覧</h1>
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