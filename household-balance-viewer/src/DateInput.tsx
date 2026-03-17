type DateInputProps = {
    title: string;
    date: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function DateInput({ title, date, onChange }: DateInputProps) {
    return (
        <div>
            <div>{title}</div>
            <input type="date" value={date} onChange={onChange} />
        </div>
    );
}

