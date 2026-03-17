import { useState, useEffect } from 'react';
import ListDropdownInput from './ListDropdownInput';
import TextInput from './TextInput';
import { SHEET_FORMAT } from './SheetFormat';
import LoadingContent from './LoadingContent';

async function createTable(accessToken: string, spreadsheetId: string, tableFormat: { title: string; headers: string[] }) {
  // Create sheet
  const createSheetResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      requests: [
        {
          addSheet: {
            properties: {
              title: tableFormat.title,
            },
          },
        },
      ],
    }),
  });

  const createSheetData = await createSheetResponse.json();
  if (createSheetData.error) {
    throw new Error(`Failed to create sheet ${tableFormat.title}: ${createSheetData.error.message}`);
  }

  // Write headers to row 1 (horizontal)
  const values = [tableFormat.headers];
  const endColumn = String.fromCharCode(64 + tableFormat.headers.length); // Assume < 26 headers for simplicity
  const range = `'${tableFormat.title}'!A1:${endColumn}1`;

  const updateValuesResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      values: values,
    }),
  });

  const updateValuesData = await updateValuesResponse.json();
  if (updateValuesData.error) {
    throw new Error(`Failed to write headers to ${tableFormat.title}: ${updateValuesData.error.message}`);
  }
}

async function checkSheetFormat(accessToken: string, spreadsheetId: string): Promise<boolean> {
  try {
    for (const tableFormat of SHEET_FORMAT.tables) {
      const endColumn = String.fromCharCode(64 + tableFormat.headers.length);
      const range = `'${tableFormat.title}'!A1:${endColumn}1`;

      const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      // Check A: Confirm that a sheet with name tableFormat.title exists.
      if (data.error) {
        return false;
      }

      // Check B: Confirm that the header row of the sheet matches tableFormat.headers.
      if (!data.values || data.values.length === 0) {
        return false;
      }

      const headers = data.values[0];
      if (headers.length !== tableFormat.headers.length) {
        return false;
      }

      for (let i = 0; i < tableFormat.headers.length; i++) {
        if (headers[i] !== tableFormat.headers[i]) {
          return false;
        }
      }
    }
    return true;
  } catch (error) {
    console.error("Format check failed:", error);
    return false;
  }
}

type AccessSheetProps = {
  accessToken: string;
  onSuccess: (spreadSheetID: string) => void;
  onFailure: () => void;
  initializeSpreadSheetID: string | undefined;
};

type Phase = 'selectMode' | 'createSheet' | 'selectSheet';

export default function AccessSheet({ accessToken, onSuccess, onFailure, initializeSpreadSheetID }: AccessSheetProps) {
  const [phase, setPhase] = useState<Phase>('selectMode');
  const sheetFormatSuccess = "Sheet format is valid";
  const sheetFormatError = "Sheet format is invalid";
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!initializeSpreadSheetID) {
      return;
    }

    const checkInitializeSpreadSheetID = async () => {
      setIsLoading(true);
      try {
        const isValid = await checkSheetFormat(accessToken, initializeSpreadSheetID);
        if (isValid) {
          console.log(sheetFormatSuccess);
          onSuccess(initializeSpreadSheetID);
        } else {
          console.error(sheetFormatError);
          window.confirm(sheetFormatError);
          onFailure();
        }
      } finally {
        setIsLoading(false);
      }
    }

    checkInitializeSpreadSheetID();

  }, [onSuccess, onFailure, initializeSpreadSheetID]);

  if (isLoading) {
    return <LoadingContent title="シートの検証中" />;
  }

  if (phase === 'selectMode') {
    return (
      <SelectMode
        onChoiceCreateSheet={() => setPhase('createSheet')}
        onChoiceSelectSheet={() => setPhase('selectSheet')}
      />
    );
  }

  if (phase === 'createSheet') {
    return (
      <CreateSheet
        accessToken={accessToken}
        onCreate={async (spreadSheetID) => {
          setIsLoading(true);
          try {
            const isValid = await checkSheetFormat(accessToken, spreadSheetID);
            if (isValid) {
              console.log(sheetFormatSuccess);
              onSuccess(spreadSheetID);
            } else {
              console.error(sheetFormatError);
              window.confirm(sheetFormatError);
              onFailure();
            }
          } finally {
            setIsLoading(false);
          }
        }}
        onBack={() => setPhase('selectMode')}
      />
    );
  }

  if (phase === 'selectSheet') {
    return (
      <SelectSheet
        accessToken={accessToken}
        onSelect={async (spreadSheetID) => {
          setIsLoading(true);
          try {
            const isValid = await checkSheetFormat(accessToken, spreadSheetID);
            if (isValid) {
              console.log(sheetFormatSuccess);
              onSuccess(spreadSheetID);
            } else {
              console.error(sheetFormatError);
              window.confirm(sheetFormatError);
              onFailure();
            }
          } finally {
            setIsLoading(false);
          }
        }}
        onFailure={() => {
          onFailure();
        }}
        onBack={() => setPhase('selectMode')}
      />
    );
  }

  return null;
}

type SelectModeProps = {
  onChoiceCreateSheet: () => void;
  onChoiceSelectSheet: () => void;
};

function SelectMode({ onChoiceCreateSheet, onChoiceSelectSheet }: SelectModeProps) {
  return (
    <div>
      <button onClick={onChoiceCreateSheet}>新規作成</button>
      <button onClick={onChoiceSelectSheet}>既存のシートを選択</button>
    </div>
  );
}

type CreateSheetProps = {
  accessToken: string;
  onCreate: (spreadSheetID: string) => void;
  onBack: () => void;
};

function CreateSheet({ accessToken, onCreate, onBack }: CreateSheetProps) {
  const [sheetName, setSheetName] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleCreate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          properties: {
            title: sheetName,
          },
        }),
      });

      const data = await response.json();

      if (!data.spreadsheetId) {
        console.error("Failed to create spreadsheet:", data);
        return;
      }

      const spreadSheetID = data.spreadsheetId;

      try {
        for (const tableFormat of SHEET_FORMAT.tables) {
          await createTable(accessToken, spreadSheetID, tableFormat);
        }
        onCreate(spreadSheetID);
      } catch (tableError) {
        console.error(tableError);
      }
    } catch (error) {
      window.confirm("Error creating spreadsheet:" + error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingContent title="シートの作成中" />;
  }

  return (
    <div>
      <TextInput
        title="シート名を入力"
        value={sheetName}
        onChange={(e) => setSheetName(e.target.value)}
      />
      <button onClick={handleCreate}>作成</button>
      <button onClick={onBack}>戻る</button>
    </div>
  );
}

type SelectSheetProps = {
  accessToken: string;
  onSelect: (spreadSheetID: string) => void;
  onFailure: () => void;
  onBack: () => void;
};

type SheetItem = {
  id: string;
  title: string;
};

interface SheetResponse {
  items: SheetItem[];
}

function SelectSheet({ accessToken, onSelect, onFailure, onBack }: SelectSheetProps) {
  const [spreadSheetID, setSpreadSheetID] = useState<string | undefined>(undefined);
  const [sheets, setSheets] = useState<SheetItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    async function fetchSheets() {
      setIsLoading(true);
      try {
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
          onFailure();
          return;
        }

        setSheets(data.items);
        setSpreadSheetID(data.items[0].id);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSheets();
  }, [accessToken, onSelect]);

  if (isLoading) {
    return <LoadingContent title="シートを取得中" />;
  }

  const handleSelect = () => {
    if (!spreadSheetID) {
      window.confirm("シートを選択してください");
      return;
    }

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
      <button onClick={handleSelect}>決定</button>
      <button onClick={onBack}>戻る</button>
    </div>
  );
}
