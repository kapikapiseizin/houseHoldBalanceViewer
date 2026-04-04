import type { TextListItem } from "./TextListItem";

type ListedTextAddProps = {
  items: TextListItem[];
  onSelected: (item: TextListItem) => void;
};

export default function ListedTextAdd({
  items,
  onSelected,
}: ListedTextAddProps) {
  return (
    <div
      style={{
        padding: "8px 4px",
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
        alignContent: "flex-start",
        backgroundColor: "#96EFFF",
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
            backgroundColor: "#5FBDFF",
            color: "#FFF",
            borderRadius: "20px",
            border: "none",
            cursor: "pointer",
          }}
        >
          +&nbsp;{item.text}
        </button>
      ))}
    </div>
  );
}
