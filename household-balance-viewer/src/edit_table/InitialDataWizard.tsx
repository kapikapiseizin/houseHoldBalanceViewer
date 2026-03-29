import React, { useState, useRef, useEffect } from "react";
import type { SheetOperator } from "../SheetOperator";
import EditBudgetMaster from "./EditBudgetMaster";

type InitialDataWizardProps = {
    sheetOperator: SheetOperator;
    onFinish: () => void;
};

export default function InitialDataWizard({ sheetOperator, onFinish }: InitialDataWizardProps) {
    const [phase, setPhase] = useState<"budgetMaster">("budgetMaster");

    return (
        <div>
            {phase === "budgetMaster" && <EditBudgetMaster sheetOperator={sheetOperator} onFinish={() => { }} />}
        </div>
    );
}
