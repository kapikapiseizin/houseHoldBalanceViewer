type TextInputProps = {
    title: string;
    value: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function TextInput({ title, value, onChange }: TextInputProps) {
    return (
        <div>
            <div>{title}</div>
            <input type="text" value={value} onChange={onChange} />
        </div>
    );
}
