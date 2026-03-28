import React from "react";
import type { TextListItem } from "./TextListItem";

type UnorderedTextListProps = {
    value: TextListItem[];
    onRenderItem: (item: TextListItem) => React.ReactNode;
    onRequestDelete: (item: TextListItem) => void;
};

export default function UnorderedTextList({ value, onRenderItem, onRequestDelete }: UnorderedTextListProps) {
    return (
        <div>
            {value.map((item) => (
                <div
                    key={String(item.id)}
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "8px",
                    }}
                >
                    {onRenderItem(item)}

                    <button onClick={() => onRequestDelete(item)}>
                        ×
                    </button>
                </div>
            ))}
        </div>
    );
};