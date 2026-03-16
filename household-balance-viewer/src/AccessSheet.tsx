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

type SheetItem = {
  id: string;
  title: string;
};

interface SheetResponse {
  items: SheetItem[];
}

function SelectSheet({ accessToken, onSelect }: SelectSheetProps) {
  const [spreadSheetID, setSpreadSheetID] = useState<string | undefined>(undefined);
  const [sheets, setSheets] = useState<SheetItem[]>([]);

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
      const dataJson = await response.json();
      const data: SheetResponse = dataJson;

      console.log(data);

      if (data.items.length < 1) {
        console.log("No sheets found");
        onSelect(undefined);
        return;
      }

      setSheets(data.items);
      setSpreadSheetID(data.items[0].id);
    }

    fetchSheets();
  }, [accessToken]);

  const handleSelect = () => {
    onSelect(spreadSheetID);
  };

  return (
    <div>
      {sheets.length > 0 && (
        <ListDropdownInput
          title="シートを選択"
          valueId={spreadSheetID}
          items={sheets.map((item) => ({ id: item.id, displayName: item.title }))}
          onChange={(id) => {
            setSpreadSheetID(id);
          }}
        />
      )}
      <button onClick={handleSelect}>Select</button>
    </div>
  );
}
