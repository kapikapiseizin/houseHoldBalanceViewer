interface TableFormat {
    readonly title: string;
    readonly headers: string[];
}

interface SheetFormat {
    readonly tables: TableFormat[];
}

export const SHEET_FORMAT: SheetFormat = {
    tables: [
        {
            title: "分類マスタ",
            headers: [
                "分類ID",
                "名前"
            ]
        },
        {
            title: "予算マスタ",
            headers: [
                "分類ID",
                "更新年月日",
                "月次予算"
            ]
        },
        {
            title: "決済テーブル",
            headers: [
                "決済ID",
                "決済日",
                "タイトル",
                "分類ID",
                "金額"
            ]
        },
        {
            title: "繰越サマリ",
            headers: [
                "分類ID",
                "計測年月",
                "繰越金額"
            ]
        },
        {
            title: "予算表示分類マスタ",
            headers: [
                "分類ID",
                "昇順上位表示優先度"
            ]
        }

    ]
} as const;