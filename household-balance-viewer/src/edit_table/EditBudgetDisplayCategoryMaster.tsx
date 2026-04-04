import type { SheetOperator } from "../SheetOperator";
import { useState, useEffect } from "react";
import LoadingContent from "../ui/LoadingContent";
import OrderedTextList from "../ui/OrderedTextList";
import PlainTextItem from "../ui/PlainTextItem";
import ListedTextAdd from "../ui/ListedTextAdd";
import type { Category } from "../SheetOperator";
import { headerStyle } from "../ui/HeaderStyle";

type EditBudgetDisplayCategoryMasterProps = {
  sheetOperator: SheetOperator;
};

export default function EditBudgetDisplayCategoryMaster({
  sheetOperator,
}: EditBudgetDisplayCategoryMasterProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [displayCategories, setDisplayCategories] = useState<Category[]>([]);
  const [unDisplayCategories, setUnDisplayCategories] = useState<Category[]>(
    [],
  );

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const categories = await sheetOperator.fetchCategories();
      const displayCategoryIDs =
        await sheetOperator.fetchOrderedBudgetDisplayCategoryIDs();
      const displayCategories: Category[] = [];
      for (const categoryID of displayCategoryIDs) {
        const category = categories.find(
          (category) => category.categoryID === categoryID,
        );
        if (category) {
          displayCategories.push(category);
        }
      }
      setDisplayCategories(displayCategories);
      setUnDisplayCategories(
        categories.filter(
          (category) => !displayCategoryIDs.includes(category.categoryID),
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [sheetOperator]);

  if (isLoading) {
    return <LoadingContent title="シートをロード中..." />;
  }

  return (
    <div>
      <div style={headerStyle}>予算の表示設定</div>
      <OrderedTextList
        value={displayCategories.map((c) => {
          return {
            id: c.categoryID,
            text: c.name,
          };
        })}
        onRenderItem={(item) => {
          return <PlainTextItem data={item.text} />;
        }}
        onRequestDelete={async (item) => {
          if (!window.confirm("本当に削除しますか？")) {
            return;
          }

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
            await sheetOperator.updateOrderedBudgetDisplayCategories(
              items.map((item) => item.id),
            );
          } finally {
            setIsLoading(false);
          }

          await fetchCategories();
        }}
      />
      <ListedTextAdd
        items={unDisplayCategories.map((c) => {
          return {
            id: c.categoryID,
            text: c.name,
          };
        })}
        onSelected={async (item) => {
          setIsLoading(true);
          try {
            await sheetOperator.requestAddDisplayBudget(item.id);
          } finally {
            setIsLoading(false);
          }

          await fetchCategories();
        }}
      />
    </div>
  );
}
