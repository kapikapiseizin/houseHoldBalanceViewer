import { useEffect, useState } from "react";
import PaymentInput from "../ui/PaymentInput";
import BalanceDisplay from "../ui/BalanceDisplay";
import type {
  SheetOperator,
  Category,
  BalanceResponse,
} from "../SheetOperator";
import LoadingContent from "../ui/LoadingContent";
import YearMonthSelect from "../ui/YearMonthSelect";
import EditCategoryMaster from "../edit_table/EditCategoryMaster";
import EditBudgetDisplayCategoryMaster from "../edit_table/EditBudgetDisplayCategoryMaster";
import EditBudgetMaster from "../edit_table/EditBudgetMaster";
import EditPaymentTable from "../edit_table/EditPaymentTable";
import GridButton from "../ui/GridButton";
import { headerStyle } from "../ui/HeaderStyle";
import { pushButtonStyle } from "../ui/PushButtonStyle";

const safeHeight =
  typeof window !== "undefined" && CSS.supports("height", "100dvh")
    ? "100dvh"
    : "100vh";

type BudgetPageProps = {
  sheetOperator: SheetOperator;
  onClickDisplaySetting: () => void;
};

function BudgetPage({ sheetOperator, onClickDisplaySetting }: BudgetPageProps) {
  const now = new Date();
  const [targetYear, setTargetYear] = useState(now.getFullYear());
  const [targetMonth, setTargetMonth] = useState(now.getMonth() + 1);

  const [balance, setBalance] = useState<BalanceResponse[]>([]);
  const [isFetchLoading, setIsFetchLoading] = useState(false);

  useEffect(() => {
    setIsFetchLoading(true);
    sheetOperator
      .computeBalance(targetYear, targetMonth)
      .then(setBalance)
      .finally(() => setIsFetchLoading(false));
  }, [sheetOperator, targetYear, targetMonth]);

  if (isFetchLoading) {
    return <LoadingContent title="データを取得中" />;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: "1",
      }}
    >
      <YearMonthSelect
        year={targetYear}
        month={targetMonth}
        onChange={(year, month) => {
          setTargetYear(year);
          setTargetMonth(month);
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
        }}
      >
        {balance.map((balance, index) => (
          <BalanceDisplay
            key={index}
            title={balance.title}
            budgetAmount={balance.budgetAmount}
            carryOverAmount={balance.carryOverAmount}
            usedAmount={balance.usedAmount}
          />
        ))}
        <details>
          <summary>ヘルプ</summary>
          <p>表示は下記の通りです</p>
          <p>======================</p>
          <p>分類</p>
          <p>残高 / 予算 + 繰り越し金額</p>
        </details>
      </div>
      <div
        style={{
          flex: "1",
          display: "flex",
          justifyContent: "flex-end", // 横：右
          alignItems: "flex-end", // 縦：下
          padding: "20px", // ← 余白
        }}
      >
        <button
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "transparent",
            color: "white",
            border: "none",
            borderRadius: "12px",
            cursor: "pointer",
            padding: "10px",
            gap: "1px",
            width: "80px",
            height: "80px",
            aspectRatio: "1 / 1",
          }}
          onClick={onClickDisplaySetting}
        >
          <img
            style={{
              width: "100%",
              height: "100%",
            }}
            src="./eye_blue3.png"
            alt="eye"
          />
          <span
            style={{
              fontSize: "0.9rem",
              color: "#5FBDFF",
              marginTop: "4px",
              whiteSpace: "nowrap",
            }}
          >
            表示設定
          </span>
        </button>
      </div>
    </div>
  );
}

type InputPageProps = {
  sheetOperator: SheetOperator;
};

function InputPage({ sheetOperator }: InputPageProps) {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const [inputDate, setInputDate] = useState(today);
  const [categoryId, setCategoryId] = useState("");
  const [isTitleManuallyEdited, setIsTitleManuallyEdited] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [amount, setAmount] = useState(0);
  const [dropdownItems, setDropdownItems] = useState<Category[]>([]);
  const [isFetchLoading, setIsFetchLoading] = useState(false);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);

  const selectedCategory = dropdownItems.find(
    (item) => item.categoryID === categoryId,
  );
  const defaultTitle = selectedCategory ? selectedCategory.name : "";
  const title = isTitleManuallyEdited ? manualTitle : defaultTitle;

  const handleTitleChange = (title: string) => {
    setIsTitleManuallyEdited(true);
    setManualTitle(title);
  };

  const handleSubmit = async () => {
    setIsSubmitLoading(true);
    try {
      await sheetOperator.requestAddPayment({
        date: inputDate,
        categoryID: categoryId,
        title,
        amount,
      });
    } finally {
      setIsSubmitLoading(false);
    }

    window.confirm("決済を登録しました");
  };

  const fetchCategories = async () => {
    setIsFetchLoading(true);
    try {
      const categories = await sheetOperator.fetchCategories();
      setDropdownItems(categories);

      if (categories.length > 0) {
        setCategoryId(categories[0].categoryID);
      }
    } finally {
      setIsFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [sheetOperator]);

  if (isFetchLoading) {
    return <LoadingContent title="データを取得中" />;
  }

  if (isSubmitLoading) {
    return <LoadingContent title="登録中" />;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: "1rem",
      }}
    >
      <div style={headerStyle}>決済を入力</div>
      <PaymentInput
        inputDate={inputDate}
        onChangeDate={setInputDate}
        title={title}
        onChangeTitle={handleTitleChange}
        categoryId={categoryId}
        dropdownItems={dropdownItems}
        onChangeCategoryID={setCategoryId}
        amount={amount}
        onChangeAmount={setAmount}
      />
      <button onClick={handleSubmit} style={pushButtonStyle}>
        登録
      </button>
    </div>
  );
}

type MenuProps = {
  onLogout: () => void;
  onEditCategoryMaster: () => void;
  onEditBudgetMaster: () => void;
  onEditPaymentTable: () => void;
};

function Menu({
  onLogout,
  onEditCategoryMaster,
  onEditBudgetMaster,
  onEditPaymentTable,
}: MenuProps) {
  return (
    <div>
      <div style={headerStyle}>メニュー</div>
      <GridButton
        elements={[
          {
            title: "Logout",
            onClick: onLogout,
            iconSrc: "/logout.png",
          },
          {
            title: "分類を編集",
            onClick: onEditCategoryMaster,
            iconSrc: "/category.png",
          },
          {
            title: "予算を編集",
            onClick: onEditBudgetMaster,
            iconSrc: "/budget.png",
          },
          {
            title: "決済を編集",
            onClick: onEditPaymentTable,
            iconSrc: "/payment.png",
          },
        ]}
      />
    </div>
  );
}

const EditPhase = {
  CATEGORY_MASTER: 0,
  BUDGET_DISPLAY_CATEGORY_MASTER: 1,
  BUDGET_MASTER: 2,
  PAYMENT_TABLE: 3,
} as const;

type EditPhase = (typeof EditPhase)[keyof typeof EditPhase];

type EditPageProps = {
  phase: EditPhase;
  sheetOperator: SheetOperator;
  onExitEditPhase: () => void;
};

function EditPage({ phase, sheetOperator, onExitEditPhase }: EditPageProps) {
  const [isEditPrevButtonVisible, setIsEditPrevButtonVisible] = useState(true);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: safeHeight,
        backgroundColor: "#C5FFF8",
      }}
    >
      {phase === EditPhase.CATEGORY_MASTER && (
        <EditCategoryMaster sheetOperator={sheetOperator} />
      )}
      {phase === EditPhase.BUDGET_DISPLAY_CATEGORY_MASTER && (
        <EditBudgetDisplayCategoryMaster sheetOperator={sheetOperator} />
      )}
      {phase === EditPhase.BUDGET_MASTER && (
        <EditBudgetMaster sheetOperator={sheetOperator} />
      )}
      {phase === EditPhase.PAYMENT_TABLE && (
        <EditPaymentTable
          sheetOperator={sheetOperator}
          onEnterTableUpdateUI={() => setIsEditPrevButtonVisible(false)}
          onExitTableUpdateUI={() => setIsEditPrevButtonVisible(true)}
        />
      )}
      {isEditPrevButtonVisible && (
        <div
          style={{
            height: "10%",
          }}
        >
          <button
            onClick={onExitEditPhase}
            style={{
              ...pushButtonStyle,
              width: "50%",
            }}
          >
            戻る
          </button>
        </div>
      )}
    </div>
  );
}

export type LoginContentProps = {
  sheetOperator: SheetOperator;
  onLogout: () => void;
};

export default function LoginContent({
  sheetOperator,
  onLogout,
}: LoginContentProps) {
  const now = new Date();
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth() + 1;

  const Phase = {
    BUDGET: 0,
    INPUT: 1,
    MENU: 2,
    EDIT: 3,
  } as const;

  const [page, setPage] = useState<number>(Phase.BUDGET);
  const [isPropagateLoading, setIsPropagateLoading] = useState(false);
  const [stackPage, setStackPage] = useState<number | undefined>(undefined);
  const [editPhase, setEditPhase] = useState<EditPhase | undefined>(undefined);

  const handleEnterEditPhase = (phase: EditPhase) => {
    setStackPage(page);
    setPage(Phase.EDIT);
    setEditPhase(phase);
  };

  const handleExitEditPhase = () => {
    if (stackPage !== undefined) {
      setPage(stackPage);
      setStackPage(undefined);
      setEditPhase(undefined);
    }
  };

  useEffect(() => {
    setIsPropagateLoading(true);
    sheetOperator
      .propagateLatestBudgetUntilTarget(nowYear, nowMonth)
      .finally(() => setIsPropagateLoading(false));
  }, [sheetOperator]);

  if (isPropagateLoading) {
    return <LoadingContent title="予算を更新中" />;
  }

  if (page === Phase.EDIT && editPhase !== undefined) {
    return (
      <EditPage
        phase={editPhase}
        sheetOperator={sheetOperator}
        onExitEditPhase={handleExitEditPhase}
      />
    );
  }

  const buttonStyle = {
    background: "transparent" /* 背景を透明に */,
    color: "white" /* 文字色を白に */,
    fontSize: "1.2em" /* フォントサイズ指定 */,
    flex: 1,
    cursor: "pointer" /* ホバー時に指マークにする */,
    padding: "10px 20px" /* クリックエリアを広げる（任意） */,
    border: "none",
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: "1fr auto" /* 上が可変、下が中身に合わせる */,
        height: safeHeight,
        backgroundColor: "#c5fff8",
      }}
    >
      <div
        style={{
          width: "100%",
          gridRow: "1",
          overflowY: "auto", // メインコンテンツ内はスクロール可能にする
          display: "flex",
          flexDirection: "column",
          position: "relative",
          boxSizing: "border-box", // パディングを含めて100%にする
        }}
      >
        {page === Phase.BUDGET && (
          <BudgetPage
            sheetOperator={sheetOperator}
            onClickDisplaySetting={() =>
              handleEnterEditPhase(EditPhase.BUDGET_DISPLAY_CATEGORY_MASTER)
            }
          />
        )}
        {page === Phase.INPUT && <InputPage sheetOperator={sheetOperator} />}
        {page === Phase.MENU && (
          <Menu
            onLogout={onLogout}
            onEditCategoryMaster={() =>
              handleEnterEditPhase(EditPhase.CATEGORY_MASTER)
            }
            onEditBudgetMaster={() =>
              handleEnterEditPhase(EditPhase.BUDGET_MASTER)
            }
            onEditPaymentTable={() =>
              handleEnterEditPhase(EditPhase.PAYMENT_TABLE)
            }
          />
        )}
      </div>
      <nav
        style={{
          gridRow: "2",
          width: "100%",
          height: "5rem",
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          backgroundColor: "#5fbdff", // 背景色が白だと文字が見えないため仮の色
          padding: "0 20px",
          boxSizing: "border-box", // パディングを含めて100%にする
          whiteSpace: "nowrap",
          borderRadius: "20px",
        }}
      >
        <button style={buttonStyle} onClick={() => setPage(Phase.BUDGET)}>
          予算
        </button>
        <button style={buttonStyle} onClick={() => setPage(Phase.INPUT)}>
          入力
        </button>
        <button style={buttonStyle} onClick={() => setPage(Phase.MENU)}>
          メニュー
        </button>
      </nav>
    </div>
  );
}
