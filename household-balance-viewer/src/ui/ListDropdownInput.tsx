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
    }, [title, valueId, items, onChange, onFinishEdit]);

    return (
        <div>
            <div>{title}</div>
            <select
                value={valueId}
                onChange={(e) => {
                    const id: string = e.target.value;
                    const item = items.find(i => String(i.id) === id);
                    if (item) {
                        onChange(item.id, item.displayName);
                    }
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
