import { useState, useEffect } from "react";

type ListDropdownInputProps = {
    title: string;
    valueId: any;
    items: { id: any; displayName: string }[];
    onChange: (id: any, displayName: string) => void;
    onFinishEdit?: () => void;
};

export default function ListDropdownInput({ title, valueId, items, onChange, onFinishEdit = () => { } }: ListDropdownInputProps) {
    const [isFirstRender, setIsFirstRender] = useState(true);
    const [prevValueId, setPrevValueId] = useState(valueId);

    useEffect(() => {
        const cachePrevValueId = prevValueId;
        setPrevValueId(valueId);

        if (isFirstRender) {
            setIsFirstRender(false);
        } else {
            if (cachePrevValueId !== valueId) {
                onFinishEdit();
            }
        }
    }, [valueId, onFinishEdit]);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ fontSize: "13px", color: "#6B7280", fontWeight: 400 }}>{title}</div>
            <select
                value={valueId}
                onChange={(e) => {
                    const id: string = e.target.value;
                    const item = items.find(i => String(i.id) === id);
                    if (item) {
                        onChange(item.id, item.displayName);
                    }
                }}
                style={{
                    padding: "10px",
                    fontSize: "16px",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    backgroundColor: "#FFFFFF",
                    color: "#111827",
                    appearance: "none",
                }}
            >
                {items.map((item) => (
                    <option key={item.id} value={item.id}>
                        {item.displayName}
                    </option>
                ))}
            </select>
        </div>
    );
}
