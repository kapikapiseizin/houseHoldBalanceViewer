import type { SheetOperator } from "../SheetOperator";
import { useState, useEffect } from "react";
import LoadingContent from "../ui/LoadingContent";
import OrderedTextList from "../ui/OrderedTextList";
import PlainTextItem from "../ui/PlainTextItem";
import ListedTextAdd from "../ui/ListedTextAdd";
import type { Category } from "../SheetOperator";

type EditBudgetDisplayCategoryMasterProps = {
    sheetOperator: SheetOperator;
    onFinish: () => void;
}

export default function EditBudgetDisplayCategoryMaster({ sheetOperator, onFinish }: EditBudgetDisplayCategoryMasterProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [categories, setCategories] = useState<Category[]>([]);

    const fetchCategories = async () => {
        setIsLoading(true);
        try {
            const categories = await sheetOperator.fetchOrderedBudgetDisplayCategories();
            setCategories(categories);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, [sheetOperator]);

    if (isLoading) {
        return <LoadingContent title="シートをロード中..." />
    }

    return (
        <div>
            <h1>予算の表示設定</h1>
            <OrderedTextList
                value={categories.map((c) => {
                    return {
                        id: c.categoryID,
                        text: c.name,
                    }
                })}
                onRenderItem={(item) => {
                    return (
                        <PlainTextItem data={item.text} />
                    );
                }}
                onRequestDelete={async (item) => {
                    setIsLoading(true);
                    try {
                        await sheetOperator.requestDeleteDisplayBudget(item.id);
                    } finally {
                        setIsLoading(false);
                    }

                    await fetchCategories();
                }}
                onChangeOrder={async (items) => {
                    setIsLoading(true);
                    try {
                        await sheetOperator.updateOrderedBudgetDisplayCategories(items.map((item) => item.id));
                    } finally {
                        setIsLoading(false);
                    }

                    await fetchCategories();
                }}
            />
            <button onClick={onFinish}>完了</button>
        </div>
    );
}