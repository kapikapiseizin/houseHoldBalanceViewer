type BalanceDisplayProps = {
  title: string;
  budgetAmount: number;
  carryOverAmount: number;
  usedAmount: number;
};

export default function BalanceDisplay({
  title,
  budgetAmount,
  carryOverAmount,
  usedAmount,
}: BalanceDisplayProps) {
  const totalAmount = budgetAmount + carryOverAmount;
  const remainingAmount = Math.max(0, totalAmount - usedAmount);

  const usedPercent = totalAmount > 0 ? (usedAmount / totalAmount) * 100 : 0;
  const carryOverPercent =
    totalAmount > 0 ? (carryOverAmount / totalAmount) * 100 : 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: "0.6rem",
        width: "90%",
        maxWidth: "500px",
        margin: "5px",
        padding: "10px",
        backgroundColor: "#F8FAFC",
        borderRadius: "20px",
        fontSize: "1.1em",
      }}
    >
      <span
        style={{
          fontSize: "1.4em",
          marginTop: "10px",
        }}
      >
        {title}
      </span>
      <div>
        残高 <span style={{ fontSize: "1.7em" }}>{remainingAmount}</span>円 /{" "}
        {budgetAmount}円 +{" "}
        <span
          style={{ color: "#ff6347" }}
          title={"先月使わなかった予算が繰り越し金額として表示されます"}
        >
          {carryOverAmount}円
        </span>
      </div>
      <div
        style={{
          position: "relative",
          height: "30px",
          width: "80%",
          border: "1px solid #ccc",
          backgroundColor: "#f0f0f0",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${carryOverPercent}%`,
            position: "absolute",
            top: "0",
            right: "0",
            height: "100%",
            backgroundColor: "#ff6347",
            zIndex: "1",
          }}
        ></div>
        <div
          style={{
            width: `${usedPercent}%`,
            position: "absolute",
            top: "0",
            left: "0",
            height: "100%",
            backgroundColor: "#b3d9ff",
            zIndex: 2,
          }}
        ></div>
      </div>
    </div>
  );
}
