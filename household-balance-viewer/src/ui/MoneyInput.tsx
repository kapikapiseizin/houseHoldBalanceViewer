type MoneyInputProps = {
  title: string;
  amount: number;
  onChange: (amount: number) => void;
  onFinishEdit?: () => void;
};

export default function MoneyInput({
  title,
  amount,
  onChange,
  onFinishEdit = () => {},
}: MoneyInputProps) {
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
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
        円
      </div>
    </div>
  );
}
