type AccessAccountProps = {
  onSuccess: (credential: {}) => void;
};

export default function AccessAccount({ onSuccess }: AccessAccountProps) {
  return (
    <div>
      <button onClick={() => onSuccess({})}>Login</button>
    </div>
  );
}
