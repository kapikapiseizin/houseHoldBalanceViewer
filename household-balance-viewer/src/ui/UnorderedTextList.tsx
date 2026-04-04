import React from "react";
import type { TextListItem } from "./TextListItem";

type UnorderedTextListProps = {
  value: TextListItem[];
  onRenderItem: (item: TextListItem) => React.ReactNode;
  onRequestDelete: (item: TextListItem) => void;
};

export default function UnorderedTextList({
  value,
  onRenderItem,
  onRequestDelete,
}: UnorderedTextListProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      {value.map((item) => (
        <div
          key={String(item.id)}
          style={{
            display: "flex",
            gap: "8px",
            backgroundColor: "#FFF",
            borderRadius: "10px",
            border: "none",
            padding: "6px",
            width: "100%",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {onRenderItem(item)}

          <button
            style={{
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
            }}
            onClick={() => onRequestDelete(item)}
          >
            <img
              style={{
                width: "18px",
                aspectRatio: "1 / 1",
              }}
              src="/delete.png"
              alt="Delete"
            />
          </button>
        </div>
      ))}
    </div>
  );
}
