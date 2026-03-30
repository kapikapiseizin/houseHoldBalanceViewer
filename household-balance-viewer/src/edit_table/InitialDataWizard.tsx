import React, { useState, useRef, useEffect } from "react";
import type { SheetOperator } from "../SheetOperator";
import EditCategoryMaster from "./EditCategoryMaster";
import EditBudgetDisplayCategoryMaster from "./EditBudgetDisplayCategoryMaster";
import EditBudgetMaster from "./EditBudgetMaster";

type InitialDataWizardProps = {
    sheetOperator: SheetOperator;
    onFinish: () => void;
};

export default function InitialDataWizard({ sheetOperator, onFinish }: InitialDataWizardProps) {
    const [phase, setPhase] = useState<"categoryMaster" | "budgetDisplayCategoryMaster" | "budgetMaster">("categoryMaster");

    const handleCategoryMasterFinish = () => {
        setPhase("budgetDisplayCategoryMaster");
    };

    const handleBudgetDisplayCategoryMasterFinish = () => {
        setPhase("budgetMaster");
    };

    const handleBudgetMasterFinish = () => {
        onFinish();
    };

    return (
        <div>
            {phase === "categoryMaster" && <EditCategoryMaster sheetOperator={sheetOperator} onFinish={handleCategoryMasterFinish} />}
            {phase === "budgetDisplayCategoryMaster" && <EditBudgetDisplayCategoryMaster sheetOperator={sheetOperator} onFinish={handleBudgetDisplayCategoryMasterFinish} />}
            {phase === "budgetMaster" && <EditBudgetMaster sheetOperator={sheetOperator} onFinish={handleBudgetMasterFinish} />}
        </div>
    );
}
