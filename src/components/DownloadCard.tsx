import { FileText, Download } from "lucide-react";

const BLUE = "#2E6FA8";

const DOCS = [
  {
    title: "Reglamento Interno de Voluntariado",
    description: "Reglamento Voluntades Huancayo 2026",
    file: "/docs/REGLAMENTO INTERNO DE VOLUNTARIADO VOLUNTADES HUANCAYO 2026.pdf",
    color: "#f87171",
    ext: "PDF",
  },
  {
    title: "Formulario de Justificación (FUT)",
    description: "Formato editable en Word",
    file: "/docs/fut.docx",
    color: BLUE,
    ext: "DOCX",
  },
];

export default function DownloadCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
      {DOCS.map((doc) => (
        <a
          key={doc.file}
          href={doc.file}
          download
          className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${doc.color}33`,
            textDecoration: "none",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.08)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.04)")
          }
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: doc.color + "1a" }}
          >
            <FileText size={16} color={doc.color} />
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-xs font-semibold truncate"
              style={{ color: "#f1f5f9" }}
            >
              {doc.title}
            </p>
            <p
              className="text-xs mt-0.5 truncate"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              {doc.description}
            </p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <span
              className="text-xs font-bold px-1.5 py-0.5 rounded"
              style={{ background: doc.color + "22", color: doc.color }}
            >
              {doc.ext}
            </span>
            <Download size={13} color="rgba(255,255,255,0.30)" />
          </div>
        </a>
      ))}
    </div>
  );
}