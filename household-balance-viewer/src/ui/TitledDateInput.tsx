import { useState, useEffect } from "react";

type TitledDateInputProps = {
    title: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onFinishEdit?: () => void;
};

export default function TitledDateInput({ title, value, onChange, onFinishEdit = () => { } }: TitledDateInputProps) {
    const [isFirstRender, setIsFirstRender] = useState(true);
    const [prevValue, setPrevValue] = useState(value);

    useEffect(() => {
        const cachePrevValue = prevValue;
        setPrevValue(value);

        if (isFirstRender) {
            setIsFirstRender(false);
        } else {
            if (cachePrevValue !== value) {
                onFinishEdit();
            }
        }
    }, [value, onFinishEdit]);

    return (
        <div>
            <div>{title}</div>
            <input
                type="date"
                value={value}
                onChange={onChange}
            />
        </div>
    );
}
