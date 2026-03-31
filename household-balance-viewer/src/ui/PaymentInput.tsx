import TitledInput from "../ui/TitledInput";
import ListDropdownInput from "../ui/ListDropdownInput";
import MoneyInput from "../ui/MoneyInput";
import type { Category } from "../SheetOperator";

type PaymentInputProps = {
    inputDate: string;
    onChangeDate: (date: string) => void;
    title: string;
    onChangeTitle: (title: string) => void;
    categoryId: string;
    dropdownItems: Category[];
    onChangeCategoryID: (categoryId: string) => void;
    amount: number;
    onChangeAmount: (amount: number) => void;
    onFinishEdit?: () => void;
}

export default function PaymentInput({
    inputDate,
    onChangeDate,
    title,
    onChangeTitle,
    categoryId,
    dropdownItems,
    onChangeCategoryID,
    amount,
    onChangeAmount: onChanngeAmount,
    onFinishEdit = () => { },
}: PaymentInputProps) {

    return (
        <div>
            <TitledInput
                inputType="date"
                title="入力日"
                value={inputDate}
                onChange={(e) => onChangeDate(e.target.value)}
                onFinishEdit={onFinishEdit}
            />
            <TitledInput
                title="タイトル"
                value={title}
                onChange={(e) => onChangeTitle(e.target.value)}
                onFinishEdit={onFinishEdit}
            />
            <ListDropdownInput
                title="種類"
                valueId={categoryId}
                items={dropdownItems.map(item => ({ id: item.categoryID, displayName: item.name }))}
                onChange={onChangeCategoryID}
                onFinishEdit={onFinishEdit}
            />
            <MoneyInput
                title="金額"
                amount={amount}
                onChange={onChanngeAmount}
                onFinishEdit={onFinishEdit}
            />
        </div>
    );
}