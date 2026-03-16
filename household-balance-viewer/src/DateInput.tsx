type DateInputProps = {
    title: string;
    date: string;
};

export default function DateInput({ title, date }: DateInputProps) {
    return (
        <div>
            <div>{title}</div>
            <input type="date" defaultValue={date} />
        </div>
    );
}

