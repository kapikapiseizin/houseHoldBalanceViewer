export type GridButtonElement = {
  title: string;
  iconSrc: string;
  onClick: () => void;
};

type GridButtonProps = {
  elements: GridButtonElement[];
};

export default function GridButton({ elements }: GridButtonProps) {
  const styleContainer = {
    display: "grid",
    /* 3列で均等に配置する場合（幅に合わせて自動調整） */
    gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))",
    gap: "16px",
    padding: "8px",
  };

  const styleButton = {
    aspectRatio: "1 / 1",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5FBDFF",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    padding: "10px",
  };

  const styleButtonImage = {
    width: "50%" /* ボタンの幅に対して大きめに設定 */,
    height: "auto",
    marginBottom: "8px" /* テキストとの間の余白 */,
  };

  const styleButtonSpan = {
    fontSize: "0.8rem" /* テキストを小さく */,
  };

  return (
    <div style={styleContainer}>
      {elements.map((element) => (
        <button
          key={element.title}
          onClick={element.onClick}
          style={styleButton}
        >
          <img
            src={element.iconSrc}
            style={styleButtonImage}
            alt={element.title}
          />
          <span style={styleButtonSpan}>{element.title}</span>
        </button>
      ))}
    </div>
  );
}
