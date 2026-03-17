type BalanceDisplayProps = {
    title: string;
    budgetAmount: number;
    carryOverAmount: number;
    usedAmount: number;
};

export default function BalanceDisplay({ title, budgetAmount, carryOverAmount, usedAmount }: BalanceDisplayProps) {
    const totalAmount = budgetAmount + carryOverAmount;
    const remainingAmount = totalAmount - usedAmount;

    const usedPercent = totalAmount > 0 ? (usedAmount / totalAmount) * 100 : 0;
    const carryOverPercent = totalAmount > 0 ? (carryOverAmount / totalAmount) * 100 : 0;

    return (
        <div className="balance-display">
            <div className="balance-title">{title}</div>
            <div className="balance-text">
                残高 {remainingAmount}円 / {budgetAmount}円 + <span className="carryover-text">{carryOverAmount}円</span>
            </div>
            <div className="balance-bar">
                <div className="bar-used" style={{ width: `${usedPercent}%` }}></div>
                <div className="bar-remaining"></div>
                <div className="bar-carryover" style={{ width: `${carryOverPercent}%` }}></div>
            </div>
        </div>
    );
}
