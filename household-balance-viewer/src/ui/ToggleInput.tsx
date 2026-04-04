import React, { useState, useRef, useEffect } from "react";

type ToggleInputProps = {
  inputType?: string;
  value: string;
  onChange: (value: string) => void;
};

export default function ToggleInput({
  inputType = "text",
  value,
  onChange,
}: ToggleInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(value);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  const finishEdit = () => {
    setIsEditing(false);
    onChange(text);
  };

  if (isEditing) {
    return (
      <input
        style={{
          textAlign: "center",
          flex: 1,
        }}
        ref={inputRef}
        value={text}
        type={inputType}
        onChange={(e) => setText(e.target.value)}
        onBlur={finishEdit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            finishEdit();
          }
        }}
      />
    );
  }

  return (
    <span
      onClick={() => setIsEditing(true)}
      style={{
        textAlign: "center",
        flex: 1,
      }}
    >
      {value}
    </span>
  );
}
