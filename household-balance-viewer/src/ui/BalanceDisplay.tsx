type BalanceDisplayProps = {
    title: string;
    budgetAmount: number;
    carryOverAmount: number;
    usedAmount: number;
};

export default function BalanceDisplay({ title, budgetAmount, carryOverAmount, usedAmount }: BalanceDisplayProps) {
    const totalAmount = budgetAmount + carryOverAmount;
    const remainingAmount = Math.max(0, totalAmount - usedAmount);

    const usedPercent = totalAmount > 0 ? (usedAmount / totalAmount) * 100 : 0;
    const carryOverPercent = totalAmount > 0 ? (carryOverAmount / totalAmount) * 100 : 0;

    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "2rem",
            width: "100%",
            maxWidth: "500px",
        }}>
            <div>{title}</div>
            <div>
                残高 {remainingAmount}円 / {budgetAmount}円 + <span>{carryOverAmount}円</span>
            </div>
            <div style={{
                position: "relative",
                height: "24px",
                width: "100%",
                border: "1px solid #ccc",
                backgroundColor: "#f0f0f0",
                overflow: "hidden",
            }}>
                <div
                    style={{
                        width: `${carryOverPercent}%`,
                        position: "absolute",
                        top: "0",
                        right: "0",
                        height: "100%",
                        backgroundColor: "#ffb3b3",
                        zIndex: "1",
                    }}></div>
                <div
                    style={{
                        width: `${usedPercent}%`,
                        position: "absolute",
                        top: "0",
                        left: "0",
                        height: "100%",
                        backgroundColor: "#b3d9ff",
                        zIndex: 2,
                    }}></div>
            </div>
        </div >
    );
}
