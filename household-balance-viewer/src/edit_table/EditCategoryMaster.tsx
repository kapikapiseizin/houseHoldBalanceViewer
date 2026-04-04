import React, { useState, useEffect } from "react";
import type { SheetOperator, Category } from "../SheetOperator";
import LoadingContent from "../ui/LoadingContent";
import UnorderedTextList from "../ui/UnorderedTextList";
import ToggleInput from "../ui/ToggleInput";
import AnyTextAdd from "../ui/AnyTextAdd";
import { headerStyle } from "../ui/HeaderStyle";

type EditCategoryMasterProps = {
  sheetOperator: SheetOperator;
};

export default function EditCategoryMaster({
  sheetOperator,
}: EditCategoryMasterProps) {
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
    return <LoadingContent title="シートをロード中..." />;
  }

  if (isUpdateLoading) {
    return <LoadingContent title="分類を更新中..." />;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: "1",
      }}
    >
      <div style={headerStyle}>分類の編集</div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          padding: "16px",
          flex: "1",
        }}
      >
        <UnorderedTextList
          value={categories.map((c) => {
            return {
              id: c.categoryID,
              text: c.name,
            };
          })}
          onRenderItem={(item) => (
            <ToggleInput
              value={item.text}
              onChange={async (text) => {
                setIsUpdateLoading(true);
                try {
                  await sheetOperator.updateCategory({
                    categoryID: item.id,
                    name: text,
                  });
                } finally {
                  setIsUpdateLoading(false);
                }

                await fetchCategories();
              }}
            />
          )}
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
      </div>
    </div>
  );
}
