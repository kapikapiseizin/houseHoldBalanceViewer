

type LoadingContentProps = {
  title: string;
};

export default function LoadingContent({ title }: LoadingContentProps) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      zIndex: 9999
    }}>
      <div>ロード中......</div>
      <div>{title}</div>
    </div>
  );
}
