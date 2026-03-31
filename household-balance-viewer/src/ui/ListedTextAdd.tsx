import type { TextListItem } from "./TextListItem";

type ListedTextAddProps = {
    items: TextListItem[];
    onSelected: (item: TextListItem) => void;
};

export default function ListedTextAdd({ items, onSelected }: ListedTextAddProps) {
    return (
        <div
            style={{
                padding: "8px 0",
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                alignContent: "flex-start",
            }}
        >
            {items.map((item) => (
                <button
                    key={String(item.id)}
                    onClick={() => onSelected(item)}
                    style={{
                        whiteSpace: "nowrap",
                        padding: "8px 12px",
                        fontSize: "16px",
                        backgroundColor: "#FFFFFF",
                        color: "#111827",
                        border: "1px solid #E5E7EB",
                        borderRadius: "20px",
                        cursor: "pointer"
                    }}
                >
                    {item.text}
                </button>
            ))}
        </div>
    );
};