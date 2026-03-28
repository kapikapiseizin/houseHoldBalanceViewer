import React, { useState, useRef, useEffect } from "react";
import ToggleTextInput from "../ui/ToggleTextInput";
import PlainTextItem from "../ui/PlainTextItem";
import UnorderedTextList from "../ui/UnorderedTextList";
import OrderedTextList from "../ui/OrderedTextList";
import AnyTextAdd from "../ui/AnyTextAdd";

type InitialDataWizardProps = {
    onFinish: () => void;
};

export default function InitialDataWizard({ onFinish }: InitialDataWizardProps) {
    const [name, setName] = useState("test");
    const [list, setList] = useState([
        { id: "1", text: "test" },
        { id: "2", text: "test2" },
        { id: "3", text: "test3" },
    ]);

    return (
        <div>
            <div>初期データ入力ウィザード</div>
            <ToggleTextInput value={name} onChange={(value) => setName(value)} />
            <PlainTextItem data="Plain Text" />
            <UnorderedTextList value={list} onRenderItem={(item) => <PlainTextItem data={item.text} />} onRequestDelete={(item) => { setList(list.filter((i) => i.id !== item.id)); }} />
            <OrderedTextList value={list} onRenderItem={(item) => <PlainTextItem data={item.text} />} onRequestDelete={(item) => { setList(list.filter((i) => i.id !== item.id)); }} onChangeOrder={(items) => { setList(items); }} />
            <AnyTextAdd onConfirm={(text) => { setList([...list, { id: crypto.randomUUID(), text }]); }} />
        </div>
    );
}
