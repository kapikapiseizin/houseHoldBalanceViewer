import React from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { TextListItem } from "./TextListItem";

type OrderedTextListProps = {
  value: TextListItem[];
  onRenderItem: (item: TextListItem) => React.ReactNode;
  onRequestDelete: (item: TextListItem) => void;
  onChangeOrder: (items: TextListItem[]) => void;
};

export default function OrderedTextList({
  value,
  onRenderItem,
  onRequestDelete,
  onChangeOrder,
}: OrderedTextListProps) {
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = value.findIndex((x) => String(x.id) === String(active.id));
    const newIndex = value.findIndex((x) => String(x.id) === String(over.id));

    const newItems = arrayMove(value, oldIndex, newIndex);
    onChangeOrder(newItems);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={value.map((x) => String(x.id))}
        strategy={verticalListSortingStrategy}
      >
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
            <SortableItem
              key={String(item.id)}
              id={String(item.id)}
              item={item}
              onRenderItem={onRenderItem}
              onRequestDelete={onRequestDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

// --- 各アイテム ---
function SortableItem({
  id,
  item,
  onRenderItem,
  onRequestDelete,
}: {
  id: string;
  item: TextListItem;
  onRenderItem: (item: TextListItem) => React.ReactNode;
  onRequestDelete: (item: TextListItem) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    display: "flex",
    gap: "8px",
    backgroundColor: "#FFF",
    borderRadius: "10px",
    border: "none",
    padding: "6px",
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
  };

  return (
    <div ref={setNodeRef} style={style}>
      {/* ドラッグハンドル */}
      <img
        {...attributes}
        {...listeners}
        style={{
          cursor: "grab",
          userSelect: "none",
          width: "16px",
          aspectRatio: "1 / 1",
        }}
        src="/dragHandle.png"
        alt="Drag handle"
      />

      {/* 表示 */}
      {onRenderItem(item)}

      {/* 削除 */}
      <button
        onClick={() => onRequestDelete(item)}
        style={{
          backgroundColor: "transparent",
          border: "none",
          cursor: "pointer",
        }}
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
  );
}
