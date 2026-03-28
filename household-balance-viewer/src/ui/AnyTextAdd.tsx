import React, { useState, useRef, useEffect } from "react";

type AnyTextAddProps = {
    onConfirm: (text: string) => void;
};

export default function AnyTextAdd({ onConfirm }: AnyTextAddProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    // 入力開始時にフォーカス
    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
        }
    }, [isEditing]);

    const handleConfirm = () => {
        onConfirm(text);
        setText("");
        setIsEditing(false);
    };

    if (!isEditing) {
        return (
            <button onClick={() => setIsEditing(true)}>
                追加
            </button>
        );
    }

    return (
        <div style={{
            display: "flex",
            gap: "8px",
            justifyContent: "center",
            alignItems: "center",
        }}>
            <input
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        handleConfirm();
                    }
                }}
            />

            <button onClick={handleConfirm}>
                確定
            </button>
        </div>
    );
};