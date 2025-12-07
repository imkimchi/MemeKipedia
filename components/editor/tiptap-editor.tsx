'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Heading from '@tiptap/extension-heading'
import Link from '@tiptap/extension-link'
import CodeBlock from '@tiptap/extension-code-block'
import Image from '@tiptap/extension-image'
import { Button } from '@/components/ui/button'
import { ImageUploadButton } from '@/components/image-upload-button'
import { getIPFSUrl } from '@/lib/ipfs'
import './tiptap-styles.css'

interface TiptapEditorProps {
  content: string
  onChange: (content: string) => void
}

export function TiptapEditor({ content, onChange }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Heading.configure({
        levels: [1, 2, 3],
      }),
      Link,
      CodeBlock,
      Image,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-invert max-w-none min-h-[400px] focus:outline-none px-4 py-3 bg-slate-800 rounded-md border border-slate-600',
      },
    },
  })

  if (!editor) {
    return null
  }

  const handleImageUpload = (cid: string, filename: string) => {
    const url = getIPFSUrl(cid)
    editor.chain().focus().setImage({ src: url, alt: filename }).run()
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 rounded-md border border-slate-600 bg-slate-800 p-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-slate-700' : ''}
        >
          Bold
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-slate-700' : ''}
        >
          Italic
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive('strike') ? 'bg-slate-700' : ''}
        >
          Strike
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'bg-slate-700' : ''}
        >
          H1
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'bg-slate-700' : ''}
        >
          H2
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={editor.isActive('codeBlock') ? 'bg-slate-700' : ''}
        >
          Code
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            const url = window.prompt('Enter URL:')
            if (url) {
              editor.chain().focus().setLink({ href: url }).run()
            }
          }}
          className={editor.isActive('link') ? 'bg-slate-700' : ''}
        >
          Link
        </Button>
        <ImageUploadButton onUpload={handleImageUpload} />
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
