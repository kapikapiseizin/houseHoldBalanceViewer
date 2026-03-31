type MoneyInputProps = {
    title: string;
    amount: number;
    onChange: (amount: number) => void;
    onFinishEdit?: () => void;
};

export default function MoneyInput({ title, amount, onChange, onFinishEdit = () => { } }: MoneyInputProps) {
    return (
        <div>
            <div>{title}</div>
            <input
                type="number"
                value={amount}
                onChange={(e) => onChange(Number(e.target.value))}
                onBlur={onFinishEdit}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        onFinishEdit();
                    }
                }}
            />円
        </div>
    );
}
