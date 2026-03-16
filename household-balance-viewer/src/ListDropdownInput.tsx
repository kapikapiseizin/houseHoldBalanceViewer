type ListDropdownInputProps = {
    title: string;
    valueId: any;
    items: { id: any; displayName: string }[];
    onChange: (id: any, displayName: string) => void;
};

export default function ListDropdownInput({ title, valueId, items, onChange }: ListDropdownInputProps) {
    return (
        <div>
            <div>{title}</div>
            <select
                value={valueId}
                onChange={(e) => {
                    const id = e.target.value;
                    const item = items.find(i => i.id === id);
                    if (item) {
                        onChange(id, item.displayName);
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
