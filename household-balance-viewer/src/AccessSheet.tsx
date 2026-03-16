import { useState } from 'react';

type AccessSheetProps = {
  accessToken: string;
  onSuccess: (spreadSheetID: string | undefined) => void;
};

type Phase = 'selectMode' | 'createSheet' | 'selectSheet';

export default function AccessSheet({ accessToken, onSuccess }: AccessSheetProps) {
  const [phase, setPhase] = useState<Phase>('selectMode');

  if (phase === 'selectMode') {
    return (
      <SelectMode
        accessToken={accessToken}
        onChoiceCreateSheet={() => setPhase('createSheet')}
        onChoiceSelectSheet={() => setPhase('selectSheet')}
      />
    );
  }

  if (phase === 'createSheet') {
    return (
      <CreateSheet
        accessToken={accessToken}
        onCreate={(spreadSheetID) => onSuccess(spreadSheetID)}
      />
    );
  }

  if (phase === 'selectSheet') {
    return (
      <SelectSheet
        accessToken={accessToken}
        onSelect={(spreadSheetID) => onSuccess(spreadSheetID)}
      />
    );
  }

  return null;
}

type SelectModeProps = {
  accessToken: string;
  onChoiceCreateSheet: () => void;
  onChoiceSelectSheet: () => void;
};

function SelectMode({ accessToken, onChoiceCreateSheet, onChoiceSelectSheet }: SelectModeProps) {
  return (
    <div>
      <button onClick={onChoiceCreateSheet}>Create</button>
      <button onClick={onChoiceSelectSheet}>Select</button>
    </div>
  );
}

type CreateSheetProps = {
  accessToken: string;
  onCreate: (spreadSheetID: string | undefined) => void;
};

function CreateSheet({ accessToken, onCreate }: CreateSheetProps) {
  return (
    <div>
      <button onClick={() => onCreate(undefined)}>Create</button>
    </div>
  );
}

type SelectSheetProps = {
  accessToken: string;
  onSelect: (spreadSheetID: string | undefined) => void;
};

function SelectSheet({ accessToken, onSelect }: SelectSheetProps) {
  return (
    <div>
      <button onClick={() => onSelect(undefined)}>Select</button>
    </div>
  );
}
