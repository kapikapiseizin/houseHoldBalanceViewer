import { useState, useRef, useEffect } from "react";

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
            <button
                onClick={() => setIsEditing(true)}
                style={{
                    backgroundColor: "#5FBDFF",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: "pointer",
                }}
            >
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
                style={{
                    border: "none",
                    borderBottom: "1px solid #E5E7EB",
                    outline: "none",
                    fontSize: "16px",
                    color: "#111827",
                    padding: "4px 12px",
                    flex: 1
                }}
            />

            <button
                onClick={handleConfirm}
                style={{
                    backgroundColor: "#5FBDFF",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    fontSize: "16px",
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap"
                }}
            >
                確定
            </button>
        </div>
    );
};