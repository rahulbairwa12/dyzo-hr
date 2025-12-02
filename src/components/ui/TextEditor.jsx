import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const TextEditor = ({ initialContent, onChange, classes }) => {
    const [text, setText] = useState('');

    useEffect(() => {
        setText(initialContent || '');
    }, [initialContent]);

    const modules = {
        toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'script': 'sub' }, { 'script': 'super' }],
            [{ 'indent': '-1' }, { 'indent': '+1' }],
            [{ 'direction': 'rtl' }],
            [{ 'size': ['small', false, 'large', 'huge'] }],
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'font': [] }],
            [{ 'align': [] }],
            ['clean'],
            ['link', 'image']
        ]
    };

    const formats = [
        'bold', 'italic', 'underline', 'strike',
        'blockquote',
        'list', 'bullet',
        'script',
        'indent',
        'direction',
        'size',
        'header',
        'color', 'background',
        'font',
        'align',
        'link', 'image'
    ];

    const handleChange = (content) => {
        setText(content);
        onChange(content);
    };

    return (
        <div className="editor-wrapper">
            <ReactQuill
                theme="snow"
                value={text}
                onChange={handleChange}
                modules={modules}
                formats={formats}
                className={classes ? classes : "h-[10rem]"}
            />
            <style>{`
                .editor-wrapper {
                    margin-bottom: 42px;
                }
                .editor-wrapper .ql-container {
                    min-height: 100px;
                }
                .editor-wrapper .ql-editor {
                    min-height: 100px;
                }
                .dark .ql-snow .ql-stroke {
                    stroke: #fff;
                }
                .dark .ql-snow .ql-fill {
                    fill: #fff;
                }
                .dark .ql-toolbar.ql-snow {
                    border-color: #475569;
                }
                .dark .ql-container.ql-snow {
                    border-color: #475569;
                }
                .dark .ql-editor {
                    color: #fff;
                }
                .dark .ql-picker {
                    color: #fff;
                }
            `}</style>
        </div>
    );
};

export default TextEditor;
