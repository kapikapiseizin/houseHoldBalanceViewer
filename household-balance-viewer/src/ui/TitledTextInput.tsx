type TitledTextInputProps = {
    title: string;
    value: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function TitledTextInput({ title, value, onChange }: TitledTextInputProps) {
    return (
        <div>
            <div>{title}</div>
            <input type="text" value={value} onChange={onChange} />
        </div>
    );
}
