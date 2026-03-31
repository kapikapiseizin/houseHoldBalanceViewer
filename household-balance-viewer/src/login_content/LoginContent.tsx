import { useEffect, useState } from "react";
import PaymentInput from "../ui/PaymentInput";
import BalanceDisplay from "../ui/BalanceDisplay";
import type { SheetOperator, Category, BalanceResponse } from "../SheetOperator";
import LoadingContent from "../ui/LoadingContent";
import YearMonthSelect from "../ui/YearMonthSelect";
import EditCategoryMaster from "../edit_table/EditCategoryMaster";
import EditBudgetDisplayCategoryMaster from "../edit_table/EditBudgetDisplayCategoryMaster";
import EditBudgetMaster from "../edit_table/EditBudgetMaster";
import EditPaymentTable from "../edit_table/EditPaymentTable";

type BudgetPageProps = {
  sheetOperator: SheetOperator;
  onClickDisplaySetting: () => void;
}

function BudgetPage({ sheetOperator, onClickDisplaySetting }: BudgetPageProps) {
  const now = new Date();
  const [targetYear, setTargetYear] = useState(now.getFullYear());
  const [targetMonth, setTargetMonth] = useState(now.getMonth() + 1);

  const [balance, setBalance] = useState<BalanceResponse[]>([]);
  const [isFetchLoading, setIsFetchLoading] = useState(false);

  useEffect(() => {
    setIsFetchLoading(true);
    sheetOperator.computeBalance(targetYear, targetMonth).then(setBalance).finally(() => setIsFetchLoading(false));
  }, [sheetOperator, targetYear, targetMonth]);

  if (isFetchLoading) {
    return <LoadingContent title="データを取得中" />;
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      <YearMonthSelect year={targetYear} month={targetMonth} onChange={(year, month) => { setTargetYear(year); setTargetMonth(month); }} />
      {balance.map((balance, index) => (
        <BalanceDisplay
          key={index}
          title={balance.title}
          budgetAmount={balance.budgetAmount}
          carryOverAmount={balance.carryOverAmount}
          usedAmount={balance.usedAmount}
        />
      ))}
      <button onClick={onClickDisplaySetting}>表示設定</button>
    </div>
  );
}

type InputPageProps = {
  sheetOperator: SheetOperator;
}

function InputPage({ sheetOperator }: InputPageProps) {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const [inputDate, setInputDate] = useState(today);
  const [categoryId, setCategoryId] = useState("");
  const [isTitleManuallyEdited, setIsTitleManuallyEdited] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [amount, setAmount] = useState(0);
  const [dropdownItems, setDropdownItems] = useState<Category[]>([]);
  const [isFetchLoading, setIsFetchLoading] = useState(false);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);

  const selectedCategory = dropdownItems.find(item => item.categoryID === categoryId);
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
        amount
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
  }

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
    <div>
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
      <button onClick={handleSubmit}>登録</button>
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
  onEditPaymentTable
}: MenuProps) {
  return (
    <div>
      <button onClick={onLogout}>Logout</button>
      <button onClick={onEditCategoryMaster}>決済の種類</button>
      <button onClick={onEditBudgetMaster}>予算を編集</button>
      <button onClick={onEditPaymentTable}>決済を編集</button>
    </div>
  );
}

const EditPhase = {
  CATEGORY_MASTER: 0,
  BUDGET_DISPLAY_CATEGORY_MASTER: 1,
  BUDGET_MASTER: 2,
  PAYMENT_TABLE: 3
} as const;

type EditPhase = typeof EditPhase[keyof typeof EditPhase];

type EditPageProps = {
  phase: EditPhase;
  sheetOperator: SheetOperator;
  onExitEditPhase: () => void;
}

function EditPage({ phase, sheetOperator, onExitEditPhase }: EditPageProps) {
  const [isEditPrevButtonVisible, setIsEditPrevButtonVisible] = useState(true);

  return (
    <div>
      {phase === EditPhase.CATEGORY_MASTER && <EditCategoryMaster sheetOperator={sheetOperator} />}
      {phase === EditPhase.BUDGET_DISPLAY_CATEGORY_MASTER && <EditBudgetDisplayCategoryMaster sheetOperator={sheetOperator} />}
      {phase === EditPhase.BUDGET_MASTER && <EditBudgetMaster sheetOperator={sheetOperator} />}
      {phase === EditPhase.PAYMENT_TABLE && <EditPaymentTable
        sheetOperator={sheetOperator}
        onEnterTableUpdateUI={() => setIsEditPrevButtonVisible(false)}
        onExitTableUpdateUI={() => setIsEditPrevButtonVisible(true)}
      />}
      {isEditPrevButtonVisible && <button onClick={onExitEditPhase}>戻る</button>}
    </div>
  );
}

export type LoginContentProps = {
  sheetOperator: SheetOperator;
  onLogout: () => void;
};

export default function LoginContent({ sheetOperator, onLogout }: LoginContentProps) {
  const now = new Date();
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth() + 1;

  const Phase = {
    BUDGET: 0,
    INPUT: 1,
    MENU: 2,
    EDIT: 3
  } as const;

  const [page, setPage] = useState<number>(Phase.BUDGET);
  const [isPropagateLoading, setIsPropagateLoading] = useState(false);
  const [stackPage, setStackPage] = useState<number | undefined>(undefined);
  const [editPhase, setEditPhase] = useState<EditPhase | undefined>(undefined);

  const handleEnterEditPhase = (phase: EditPhase) => {
    setStackPage(page);
    setPage(Phase.EDIT);
    setEditPhase(phase);
  }

  const handleExitEditPhase = () => {
    if (stackPage !== undefined) {
      setPage(stackPage);
      setStackPage(undefined);
      setEditPhase(undefined);
    }
  }

  useEffect(() => {
    setIsPropagateLoading(true);
    sheetOperator.propagateLatestBudgetUntilTarget(nowYear, nowMonth).finally(() => setIsPropagateLoading(false));
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
    background: "transparent", /* 背景を透明に */
    color: "white",            /* 文字色を白に */
    fontSize: "1.2em",        /* フォントサイズ指定 */
    flex: 1,
    cursor: "pointer",         /* ホバー時に指マークにする */
    padding: "10px 20px",      /* クリックエリアを広げる（任意） */
    border: "none",
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column', // 縦に並べる
    }}>
      <div style={{
        height: '90vh',
        overflowY: 'auto',      // メインコンテンツ内はスクロール可能にする
        backgroundColor: "#c5fff8"
      }}>
        {page === Phase.BUDGET && <BudgetPage sheetOperator={sheetOperator} onClickDisplaySetting={() => handleEnterEditPhase(EditPhase.BUDGET_DISPLAY_CATEGORY_MASTER)} />}
        {page === Phase.INPUT && <InputPage sheetOperator={sheetOperator} />}
        {
          page === Phase.MENU && <Menu
            onLogout={onLogout}
            onEditCategoryMaster={() => handleEnterEditPhase(EditPhase.CATEGORY_MASTER)}
            onEditBudgetMaster={() => handleEnterEditPhase(EditPhase.BUDGET_MASTER)}
            onEditPaymentTable={() => handleEnterEditPhase(EditPhase.PAYMENT_TABLE)}
          />
        }
      </div>
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        height: '10vh',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#5fbdff', // 背景色が白だと文字が見えないため仮の色
        padding: '0 20px',
        boxSizing: 'border-box', // パディングを含めて100%にする
        whiteSpace: "nowrap"
      }}>
        <button style={buttonStyle} onClick={() => setPage(Phase.BUDGET)}>予算</button>
        <button style={buttonStyle} onClick={() => setPage(Phase.INPUT)}>入力</button>
        <button style={buttonStyle} onClick={() => setPage(Phase.MENU)}>メニュー</button>
      </nav>
    </div >
  );
}
