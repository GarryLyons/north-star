"use client";

import dynamic from "next/dynamic";
import {
    BtnBold,
    BtnItalic,
    BtnUnderline,
    BtnStrikeThrough,
    BtnBulletList,
    BtnNumberedList,
    BtnLink,
    BtnClearFormatting,
    Toolbar,
    Editor,
    EditorProvider
} from 'react-simple-wysiwyg';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export default function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
    return (
        <div className={`bg-white ${className}`}>
            <EditorProvider>
                <Editor
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    containerProps={{ style: { minHeight: '200px' } }}
                >
                    <Toolbar>
                        <BtnBold />
                        <BtnItalic />
                        <BtnUnderline />
                        <BtnStrikeThrough />
                        <BtnBulletList />
                        <BtnNumberedList />
                        <BtnLink />
                        <BtnClearFormatting />
                    </Toolbar>
                </Editor>
            </EditorProvider>
        </div>
    );
}
