type TitledInputProps = {
    inputType?: string;
    title: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onFinishEdit?: () => void;
};

export default function TitledInput({ inputType = "text", title, value, onChange, onFinishEdit = () => { } }: TitledInputProps) {
    return (
        <div>
            <div>{title}</div>
            <input
                type={inputType}
                value={value}
                onChange={onChange}
                onBlur={onFinishEdit}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        onFinishEdit();
                    }
                }}
            />
        </div>
    );
}
