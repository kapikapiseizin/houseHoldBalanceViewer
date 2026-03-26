import React, { useState, useRef, useEffect } from "react";

type ToggleTextInputProps = {
    value: string;
    onChange: (value: string) => void;
};

export const ToggleTextInput: React.FC<ToggleTextInputProps> = ({ value, onChange }) => {
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
        }
    }, [isEditing]);

    const finishEdit = () => {
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <input
                ref={inputRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onBlur={finishEdit}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        finishEdit();
                    }
                }}
            />
        );
    }

    return (
        <span onClick={() => setIsEditing(true)}>
            {value}
        </span>
    );
};