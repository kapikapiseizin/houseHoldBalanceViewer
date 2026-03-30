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

    return (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button onClick={handlePrev}>◀</button>
            <span>{formatted}</span>
            <button onClick={handleNext}>▶</button>
        </div>
    );
};