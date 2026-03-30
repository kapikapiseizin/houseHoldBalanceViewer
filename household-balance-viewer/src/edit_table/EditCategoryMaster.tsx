import React, { useState, useRef, useEffect } from "react";
import type { SheetOperator, Category } from "../SheetOperator";
import LoadingContent from "../ui/LoadingContent";
import UnorderedTextList from "../ui/UnorderedTextList";
import ToggleInput from "../ui/ToggleInput";
import AnyTextAdd from "../ui/AnyTextAdd";

type EditCategoryMasterProps = {
    sheetOperator: SheetOperator;
    onFinish: () => void;
};

export default function EditCategoryMaster({ sheetOperator, onFinish }: EditCategoryMasterProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isFetchLoading, setIsFetchLoading] = useState<boolean>(false);
    const [isUpdateLoading, setIsUpdateLoading] = useState<boolean>(false);

    const fetchCategories = async () => {
        setIsFetchLoading(true);
        try {
            const categories = await sheetOperator.fetchCategories();
            setCategories(categories);
        } finally {
            setIsFetchLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, [sheetOperator]);

    if (isFetchLoading) {
        return <LoadingContent title="シートをロード中..." />
    }

    if (isUpdateLoading) {
        return <LoadingContent title="分類を更新中..." />
    }

    return (
        <div>
            <h1>分類の編集</h1>
            <UnorderedTextList value={categories.map((c) => {
                return {
                    id: c.categoryID,
                    text: c.name,
                }
            })}
                onRenderItem={(item) =>
                    <ToggleInput
                        value={item.text}
                        onChange={async (text) => {
                            setIsUpdateLoading(true);
                            try {
                                await sheetOperator.updateCategory({ categoryID: item.id, name: text });
                            } finally {
                                setIsUpdateLoading(false);
                            }

                            await fetchCategories();
                        }}
                    />}
                onRequestDelete={async (item) => {
                    if (!window.confirm("本当に削除しますか？")) {
                        return;
                    }

                    setIsUpdateLoading(true);
                    try {
                        await sheetOperator.requestDeleteCategory(item.id);
                    } finally {
                        setIsUpdateLoading(false);
                    }

                    await fetchCategories();
                }}
            />
            <AnyTextAdd
                onConfirm={async (text) => {
                    setIsUpdateLoading(true);
                    try {
                        await sheetOperator.requestAddCategory(text);
                    } finally {
                        setIsUpdateLoading(false);
                    }

                    await fetchCategories();
                }}
            />
            <div>
                <button onClick={onFinish}>完了</button>
            </div>
        </div>
    );
}
