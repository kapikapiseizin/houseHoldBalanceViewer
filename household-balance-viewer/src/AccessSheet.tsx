type AccessSheetProps = {
  accessToken: string;
  onSuccess: (spreadsheetId: string) => void;
};

export default function AccessSheet({ accessToken, onSuccess }: AccessSheetProps) {
  return (
    <div>
      <button onClick={() => onSuccess("")}>Access Sheet</button>
    </div>
  );
}
