import { useState, useEffect } from "react";

type TitledDateInputProps = {
  title: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFinishEdit?: () => void;
};

export default function TitledDateInput({
  title,
  value,
  onChange,
  onFinishEdit = () => {},
}: TitledDateInputProps) {
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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <div
        style={{
          fontSize: "16px",
          color: "#6B7280",
          fontWeight: 400,
        }}
      >
        {title}
      </div>
      <input
        type="date"
        value={value}
        onChange={onChange}
        style={{
          padding: "10px",
          fontSize: "16px",
          border: "1px solid #E5E7EB",
          borderRadius: "8px",
          backgroundColor: "#FFFFFF",
          color: "#111827",
          outline: "none",
          boxSizing: "border-box",
          width: "100%",
        }}
      />
    </div>
  );
}
