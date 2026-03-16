import { useState, useEffect } from 'react';
import ListDropdownInput from './ListDropdownInput';

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

type Sheet = {
  id: string;
  name: string;
};

function SelectSheet({ accessToken, onSelect }: SelectSheetProps) {
  const [spreadSheetID, setSpreadSheetID] = useState<string | undefined>(undefined);
  const [sheets, setSheets] = useState<Sheet[]>([]);

  useEffect(() => {
    async function fetchSheets() {
      const params = new URLSearchParams({
        q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
        fields: "items(id, title)"
      });
      const url = `https://www.googleapis.com/drive/v2/files?${params.toString()}`;
      const response = await fetch(
        url,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();
      const files: Sheet[] = data.files || [];

      if (files.length < 1) {
        console.log("No sheets found");
        onSelect(undefined);
      } else {
        setSheets(files);
        setSpreadSheetID(files[0].id);
      }
    }

    fetchSheets();
  }, [accessToken]);

  const handleSelect = () => {
    onSelect(spreadSheetID);
  };

  const selectedIndex = Math.max(0, sheets.findIndex(s => s.id === spreadSheetID));
  const items = sheets.map((s, index) => ({ id: index, displayName: s.name }));

  return (
    <div>
      {sheets.length > 0 && (
        <ListDropdownInput
          title="シートを選択"
          valueId={selectedIndex}
          items={items}
          onChange={(id) => {
            const sheet = sheets[id];
            if (sheet) {
              setSpreadSheetID(sheet.id);
            }
          }}
        />
      )}
      <button onClick={handleSelect}>Select</button>
    </div>
  );
}
