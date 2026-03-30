import React, { useState, useRef, useEffect } from "react";
import type { SheetOperator } from "../SheetOperator";
import EditCategoryMaster from "./EditCategoryMaster";
import EditBudgetDisplayCategoryMaster from "./EditBudgetDisplayCategoryMaster";
import EditBudgetMaster from "./EditBudgetMaster";
import EditPaymentTable from "./EditPaymentTable";

type InitialDataWizardProps = {
    sheetOperator: SheetOperator;
    onFinish: () => void;
};

export default function InitialDataWizard({ sheetOperator, onFinish }: InitialDataWizardProps) {
    const [phase, setPhase] = useState<
        "categoryMaster" |
        "budgetDisplayCategoryMaster" |
        "budgetMaster" |
        "paymentTable"
    >("categoryMaster");

    const handleCategoryMasterFinish = () => {
        setPhase("budgetDisplayCategoryMaster");
    };

    const handleBudgetDisplayCategoryMasterFinish = () => {
        setPhase("budgetMaster");
    };

    const handleBudgetMasterFinish = () => {
        setPhase("paymentTable");
    };

    return (
        <div>
            {phase === "categoryMaster" && <EditCategoryMaster sheetOperator={sheetOperator} onFinish={handleCategoryMasterFinish} />}
            {phase === "budgetDisplayCategoryMaster" && <EditBudgetDisplayCategoryMaster sheetOperator={sheetOperator} onFinish={handleBudgetDisplayCategoryMasterFinish} />}
            {phase === "budgetMaster" && <EditBudgetMaster sheetOperator={sheetOperator} onFinish={handleBudgetMasterFinish} />}
            {phase === "paymentTable" && <EditPaymentTable sheetOperator={sheetOperator} onFinish={onFinish} />}
        </div>
    );
}
