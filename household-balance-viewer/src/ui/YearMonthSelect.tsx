import React from "react";

type YearMonthSelectProps = {
    year: number;   // 西暦
    month: number;  // 1～12
    onChange: (year: number, month: number) => void;
};

export default function YearMonthSelect({ year, month, onChange }: YearMonthSelectProps) {
    const handlePrev = () => {
        let newYear = year;
        let newMonth = month - 1;

        if (newMonth < 1) {
            newMonth = 12;
            newYear -= 1;
        }

        onChange(newYear, newMonth);
    };

    const handleNext = () => {
        let newYear = year;
        let newMonth = month + 1;

        if (newMonth > 12) {
            newMonth = 1;
            newYear += 1;
        }

        onChange(newYear, newMonth);
    };

    const formatted = `${year}-${String(month).padStart(2, "0")}`;

    const buttonStyle = {
        color: "#FFFFFF",
        fontSize: "1.5em",
        backgroundColor: "transparent",
        border: "none",
        cursor: "pointer",
    };

    return (
        <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "8px",
            fontSize: "1.5em",
            height: "10vh",
            width: "100%",
            backgroundColor: "#7b66ff",
            color: "#FFFFFF",
        }}>
            <button onClick={handlePrev} style={buttonStyle}>&lt;</button>
            <span>{formatted}</span>
            <button onClick={handleNext} style={buttonStyle}>&gt;</button>
        </div>
    );
};