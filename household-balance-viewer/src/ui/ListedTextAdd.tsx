import type { TextListItem } from "./TextListItem";

type ListedTextAddProps = {
    items: TextListItem[];
    onSelected: (item: TextListItem) => void;
};

export default function ListedTextAdd({ items, onSelected }: ListedTextAddProps) {
    return (
        <div
            style={{
                border: "1px solid #ccc",
                padding: "8px",
                display: "flex",
                flexWrap: "wrap",       // ← 折り返し
                gap: "8px",             // ← ボタン間の間隔
                alignContent: "flex-start",
            }}
        >
            {items.map((item) => (
                <button
                    key={String(item.id)}
                    onClick={() => onSelected(item)}
                    style={{
                        whiteSpace: "nowrap", // ← サイズ固定（伸びない）
                    }}
                >
                    {item.text}
                </button>
            ))}
        </div>
    );
};