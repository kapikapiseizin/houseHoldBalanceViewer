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
    const sensors = useSensors(
        useSensor(PointerSensor)
    );

    const handleDragEnd = (event: any) => {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        const oldIndex = value.findIndex(
            (x) => String(x.id) === String(active.id)
        );
        const newIndex = value.findIndex(
            (x) => String(x.id) === String(over.id)
        );

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
                <div>
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
};

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
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "8px",
    };

    return (
        <div ref={setNodeRef} style={style}>
            {/* ドラッグハンドル */}
            <span
                {...attributes}
                {...listeners}
                style={{ cursor: "grab", userSelect: "none" }}
            >
                *
            </span>

            {/* 表示 */}
            {onRenderItem(item)}

            {/* 削除 */}
            <button onClick={() => onRequestDelete(item)}>×</button>
        </div>
    );
};