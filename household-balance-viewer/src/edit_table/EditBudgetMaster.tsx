import React, { useState, useRef, useEffect } from "react";
import type { SheetOperator } from "../SheetOperator";

type EditBudgetMasterProps = {
    sheetOperator: SheetOperator;
    onFinish: () => void;
};

export default function EditBudgetMaster({ onFinish }: EditBudgetMasterProps) {
    return (
        <div>
            <h1>分類の編集</h1>

        </div>
    );
}
