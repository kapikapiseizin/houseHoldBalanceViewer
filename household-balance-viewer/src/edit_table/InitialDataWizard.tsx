import React, { useState, useRef, useEffect } from "react";
import type { SheetOperator } from "../SheetOperator";
import EditCategoryMaster from "./EditCategoryMaster";
import EditBudgetDisplayCategoryMaster from "./EditBudgetDisplayCategoryMaster";

type InitialDataWizardProps = {
    sheetOperator: SheetOperator;
    onFinish: () => void;
};

export default function InitialDataWizard({ sheetOperator, onFinish }: InitialDataWizardProps) {
    const [phase, setPhase] = useState<"categoryMaster" | "budgetDisplayCategoryMaster">("categoryMaster");

    const handleCategoryMasterFinish = () => {
        setPhase("budgetDisplayCategoryMaster");
    };

    const handleBudgetDisplayCategoryMasterFinish = () => {
        onFinish();
    };

    return (
        <div>
            {phase === "categoryMaster" && <EditCategoryMaster sheetOperator={sheetOperator} onFinish={handleCategoryMasterFinish} />}
            {phase === "budgetDisplayCategoryMaster" && <EditBudgetDisplayCategoryMaster sheetOperator={sheetOperator} onFinish={handleBudgetDisplayCategoryMasterFinish} />}
        </div>
    );
}
