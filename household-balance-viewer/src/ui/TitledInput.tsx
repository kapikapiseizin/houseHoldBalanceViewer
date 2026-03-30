type TitledInputProps = {
    inputType?: string;
    title: string;
    value: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function TitledInput({ inputType = "text", title, value, onChange }: TitledInputProps) {
    return (
        <div>
            <div>{title}</div>
            <input type={inputType} value={value} onChange={onChange} />
        </div>
    );
}
