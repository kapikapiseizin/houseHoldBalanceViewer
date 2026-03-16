type MoneyInputProps = {
    title: string;
    amount: number;
    onChange: (amount: number) => void;
};

export default function MoneyInput({ title, amount, onChange }: MoneyInputProps) {
    return (
        <div>
            <div>{title}</div>
            <input
                type="number"
                value={amount}
                onChange={(e) => onChange(Number(e.target.value))}
            />円
        </div>
    );
}
