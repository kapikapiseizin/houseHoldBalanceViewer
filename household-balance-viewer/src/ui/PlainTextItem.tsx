export default function PlainTextItem({ data }: { data: string }) {
  return (
    <p
      style={{
        textAlign: "center",
        flex: 1,
      }}
    >
      {data}
    </p>
  );
}
