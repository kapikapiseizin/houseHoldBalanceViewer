type AccessSheetProps = {
  accountCredential: {};
  onSuccess: (credential: {}) => void;
};

export default function AccessSheet({ accountCredential: _accountCredential, onSuccess }: AccessSheetProps) {
  return (
    <div>
      <button onClick={() => onSuccess({})}>Access Sheet</button>
    </div>
  );
}
