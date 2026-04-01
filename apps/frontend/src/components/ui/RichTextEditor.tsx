import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const modules = {
  toolbar: [
    [{ header: [1, 2, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    ['link'],
    ['clean'],
  ],
};

const formats = [
  'header',
  'bold',
  'italic',
  'underline',
  'strike',
  'list',
  'bullet',
  'indent',
  'link',
];

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  id?: string;
  'aria-label'?: string;
};

export function RichTextEditor({ value, onChange, placeholder, id, 'aria-label': ariaLabel }: Props) {
  return (
    <div className="rich-text-editor rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700/50 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500 dark:focus-within:border-blue-500">
      <ReactQuill
        theme="snow"
        value={value || ''}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        id={id}
        aria-label={ariaLabel}
        className="[&_.ql-editor]:min-h-[120px] [&_.ql-editor]:text-sm [&_.ql-editor]:text-slate-900 dark:[&_.ql-editor]:text-slate-200 [&_.ql-toolbar]:border-slate-200 dark:[&_.ql-toolbar]:border-slate-600 [&_.ql-toolbar]:bg-slate-50 dark:[&_.ql-toolbar]:bg-slate-800/80 [&_.ql-container]:border-slate-200 dark:[&_.ql-container]:border-slate-600 [&_.ql-container]:border-t-0 [&_.ql-snow_.ql-stroke]:stroke-slate-600 dark:[&_.ql-snow_.ql-stroke]:stroke-slate-300 [&_.ql-snow_.ql-fill]:fill-slate-600 dark:[&_.ql-snow_.ql-fill]:fill-slate-300"
      />
    </div>
  );
}
