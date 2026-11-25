"use client";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { useRef, useEffect, useReducer } from "react";

/**
 * Image avec ancrage par rapport au texte : plein (bloc), flottante à gauche,
 * flottante à droite, ou centrée. L'ancrage est stocké en attribut `data-align`
 * sur la balise <img> ; l'habillage (float + largeur + repli mobile) est géré
 * par les règles `.prose img[data-align=…]` de globals.css, partagées entre
 * l'éditeur et l'affichage public.
 */
const AlignedImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      align: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute("data-align"),
        renderHTML: (attrs: { align?: string | null }) =>
          attrs.align ? { "data-align": attrs.align } : {},
      },
    };
  },
});

/**
 * Éditeur de texte riche (WYSIWYG) basé sur TiptTap.
 * Produit du HTML propre, stocké tel quel en base et affiché via le style `prose`
 * (identique aux articles de blog). L'upload d'image réutilise /admin/upload (Vercel Blob).
 */
export default function RichTextEditor({
  value,
  onChange,
  onUploadingChange,
}: {
  value: string;
  onChange: (html: string) => void;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false, // requis en SSR (Next.js) pour éviter un mismatch d'hydratation
    extensions: [
      StarterKit.configure({
        link: { openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" } },
        heading: { levels: [2, 3] },
      }),
      TextStyle,
      Color,
      AlignedImage.configure({ inline: false, HTMLAttributes: { class: "rounded-lg" } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "prose prose-sm prose-gray max-w-none focus:outline-none min-h-[220px] px-3 py-2",
      },
    },
  });

  // TipTap v3 ne re-rend pas React à chaque transaction : on force le rafraîchissement
  // pour que les états actifs de la barre d'outils et les boutons d'ancrage d'image
  // (affichés seulement quand une image est sélectionnée) reflètent la sélection courante.
  const [, forceRender] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    if (!editor) return;
    const update = () => forceRender();
    editor.on("transaction", update);
    return () => {
      editor.off("transaction", update);
    };
  }, [editor]);

  if (!editor) {
    return (
      <div className="border border-gray-300 rounded min-h-[260px] bg-gray-50 animate-pulse" />
    );
  }

  const uploadImage = async (files: FileList | null) => {
    if (!files || !files.length) return;
    const file = files[0];
    onUploadingChange?.(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/admin/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (res.ok && json.url) {
        editor.chain().focus().setImage({ src: json.url, alt: file.name }).run();
      }
    } finally {
      onUploadingChange?.(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL du lien (vide pour retirer) :", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="border border-gray-300 rounded overflow-hidden">
      <Toolbar editor={editor} onPickImage={() => fileRef.current?.click()} onLink={setLink} />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => uploadImage(e.target.files)}
      />
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({
  editor,
  onPickImage,
  onLink,
}: {
  editor: Editor;
  onPickImage: () => void;
  onLink: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 px-2 py-1.5">
      <Btn on={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Gras">
        <strong>B</strong>
      </Btn>
      <Btn on={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italique">
        <em>I</em>
      </Btn>
      <Btn on={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Souligné">
        <span className="underline">U</span>
      </Btn>
      <Btn on={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Barré">
        <span className="line-through">S</span>
      </Btn>
      <Sep />
      <Btn on={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Titre">
        T<sub>1</sub>
      </Btn>
      <Btn on={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Sous-titre">
        T<sub>2</sub>
      </Btn>
      <Btn on={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Liste à puces">
        • —
      </Btn>
      <Btn on={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Liste numérotée">
        1.
      </Btn>
      <Btn on={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Citation">
        &ldquo;&rdquo;
      </Btn>
      <Sep />
      <Btn on={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Aligner à gauche">
        ⇤
      </Btn>
      <Btn on={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Centrer">
        ↔
      </Btn>
      <Btn on={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Aligner à droite">
        ⇥
      </Btn>
      <Sep />
      {/* Couleur du texte */}
      <label className="relative inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-200 cursor-pointer" title="Couleur du texte">
        <span className="text-sm font-semibold" style={{ color: (editor.getAttributes("textStyle").color as string) || "#111827" }}>A</span>
        <input
          type="color"
          className="absolute inset-0 opacity-0 cursor-pointer"
          value={(editor.getAttributes("textStyle").color as string) || "#111827"}
          onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
        />
      </label>
      <Btn on={() => editor.chain().focus().setColor("#dc2626").run()} title="Rouge (avertissement)">
        <span className="text-red-600 font-semibold">A</span>
      </Btn>
      <Btn on={() => editor.chain().focus().unsetColor().run()} title="Couleur par défaut">
        <span className="text-gray-400 text-xs">✕A</span>
      </Btn>
      <Sep />
      <Btn on={onLink} active={editor.isActive("link")} title="Lien">
        🔗
      </Btn>
      <Btn on={onPickImage} title="Insérer une image">
        🖼
      </Btn>
      <Btn on={() => editor.chain().focus().setHorizontalRule().run()} title="Séparateur">
        —
      </Btn>
      {editor.isActive("image") && (
        <>
          <Sep />
          <span className="px-1 text-xs text-gray-500">Image&nbsp;:</span>
          <Btn
            on={() => editor.chain().focus().updateAttributes("image", { align: null }).run()}
            active={editor.isActive("image", { align: null })}
            title="Pleine largeur"
          >
            <span className="text-xs">Plein</span>
          </Btn>
          <Btn
            on={() => editor.chain().focus().updateAttributes("image", { align: "left" }).run()}
            active={editor.isActive("image", { align: "left" })}
            title="Image à gauche, texte à droite"
          >
            <span className="text-xs">◧ Gauche</span>
          </Btn>
          <Btn
            on={() => editor.chain().focus().updateAttributes("image", { align: "center" }).run()}
            active={editor.isActive("image", { align: "center" })}
            title="Image centrée"
          >
            <span className="text-xs">Centré</span>
          </Btn>
          <Btn
            on={() => editor.chain().focus().updateAttributes("image", { align: "right" }).run()}
            active={editor.isActive("image", { align: "right" })}
            title="Image à droite, texte à gauche"
          >
            <span className="text-xs">Droite ◨</span>
          </Btn>
        </>
      )}
      <Sep />
      <Btn on={() => editor.chain().focus().undo().run()} title="Annuler">
        ↶
      </Btn>
      <Btn on={() => editor.chain().focus().redo().run()} title="Rétablir">
        ↷
      </Btn>
    </div>
  );
}

function Btn({
  on,
  active,
  title,
  children,
}: {
  on: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      // Empêche le bouton de retirer le focus de l'éditeur (sinon la sélection
      // est perdue et la commande ne s'applique pas au texte sélectionné).
      onMouseDown={(e) => e.preventDefault()}
      onClick={on}
      title={title}
      className={`inline-flex items-center justify-center min-w-8 h-8 px-1.5 rounded text-sm transition-colors ${
        active ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-200"
      }`}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span className="mx-0.5 h-5 w-px bg-gray-300" />;
}
