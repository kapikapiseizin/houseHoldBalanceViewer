import React, { useState, useRef, useEffect } from "react";
import type { SheetOperator } from "../SheetOperator";
import EditCategoryMaster from "./EditCategoryMaster";

type InitialDataWizardProps = {
    sheetOperator: SheetOperator;
    onFinish: () => void;
};

export default function InitialDataWizard({ sheetOperator, onFinish }: InitialDataWizardProps) {
    const [phase, setPhase] = useState<"categoryMaster">("categoryMaster");

    return (
        <div>
            {phase === "categoryMaster" && <EditCategoryMaster sheetOperator={sheetOperator} onFinish={() => { }} />}
        </div>
    );
}
