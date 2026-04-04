import React, { useState, useRef, useEffect } from "react";
import type { SheetOperator } from "../SheetOperator";
import EditCategoryMaster from "./EditCategoryMaster";
import EditBudgetDisplayCategoryMaster from "./EditBudgetDisplayCategoryMaster";
import EditBudgetMaster from "./EditBudgetMaster";
import { pushButtonStyle } from "../ui/PushButtonStyle";

type InitialDataWizardProps = {
  sheetOperator: SheetOperator;
  onCancel: () => void;
  onFinish: () => void;
};

export default function InitialDataWizard({
  sheetOperator,
  onCancel,
  onFinish,
}: InitialDataWizardProps) {
  const EditPhase = {
    CategoryMaster: 0,
    BudgetDisplayCategoryMaster: 1,
    BudgetMaster: 2,
  } as const;

  type EditPhase = (typeof EditPhase)[keyof typeof EditPhase];

  const [phase, setPhase] = useState<EditPhase>(EditPhase.CategoryMaster);
  const [isDisplayButtons, setIsDisplayButtons] = useState(true);

  const handleNextPhase = () => {
    if (phase == EditPhase.BudgetMaster) {
      onFinish();
      return;
    }

    setPhase((phase + 1) as EditPhase);
  };

  const handlePreviousPhase = () => {
    if (phase == EditPhase.CategoryMaster) {
      onCancel();
      return;
    }

    setPhase((phase - 1) as EditPhase);
  };

  return (
    <div>
      {phase === EditPhase.CategoryMaster && (
        <EditCategoryMaster sheetOperator={sheetOperator} />
      )}
      {phase === EditPhase.BudgetDisplayCategoryMaster && (
        <EditBudgetDisplayCategoryMaster sheetOperator={sheetOperator} />
      )}
      {phase === EditPhase.BudgetMaster && (
        <EditBudgetMaster sheetOperator={sheetOperator} />
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        {isDisplayButtons && (
          <button onClick={handlePreviousPhase} style={pushButtonStyle}>
            戻る
          </button>
        )}
        {isDisplayButtons && (
          <button onClick={handleNextPhase} style={pushButtonStyle}>
            次へ
          </button>
        )}
      </div>
    </div>
  );
}
