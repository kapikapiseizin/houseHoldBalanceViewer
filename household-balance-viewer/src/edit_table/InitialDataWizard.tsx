import React, { useState, useRef, useEffect } from "react";
import ToggleTextInput from "../ui/ToggleTextInput";

type InitialDataWizardProps = {
    onFinish: () => void;
};

export default function InitialDataWizard({ onFinish }: InitialDataWizardProps) {
    const [name, setName] = useState("test");

    return (
        <div>
            <div>初期データ入力ウィザード</div>
            <ToggleTextInput value={name} onChange={(value) => setName(value)} />
        </div>
    );
}
