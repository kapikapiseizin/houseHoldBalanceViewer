type LoadingContentProps = {
  title: string;
};

export default function LoadingContent({ title }: LoadingContentProps) {
  // 親要素のスタイル（画面中央・角丸正方形）
  const containerStyle: React.CSSProperties = {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "50vw",
    aspectRatio: "1 / 1",
    maxWidth: "400px",
    backgroundColor: "#888",
    color: "white",
    borderRadius: "24px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: "20px",
    zIndex: 9999, // 最前面に表示
  } as const;

  // 画像のスタイル
  const imageStyle = {
    width: "40%",
    height: "auto",
    // アニメーション名だけはCSS側で定義したものを指定
    animation: "spin 2s linear infinite",
  };

  return (
    <div style={containerStyle}>
      {/* 回転アニメーションを動かすために、ここだけCSSが必要 */}
      <style>
        {`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}
      </style>

      <img src="/loading_circle.png" style={imageStyle} alt="Loading..." />
      <div style={{ fontSize: "1.2rem", fontWeight: "bold" }}>{title}</div>
    </div>
  );
}
