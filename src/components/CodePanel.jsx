import React, { useState, useMemo } from 'react'
import { Highlight, themes } from 'prism-react-renderer'
import { X, Copy, Check, Download, ChevronDown, Code2, FileCode } from 'lucide-react'
import { saveAs } from 'file-saver'
import JSZip from 'jszip'
import useStore from '../stores/useStore'
import { generateSchemaCode, generateFullProject } from '../generators/mongooseGenerator'

const CodePanel = () => {
  const { nodes, projectName, setShowCodePanel } = useStore()
  const [selectedCollection, setSelectedCollection] = useState(null)
  const [copied, setCopied] = useState(false)

  const collections = nodes.filter(n => n.type === 'collection')

  const currentCode = useMemo(() => {
    if (!selectedCollection && collections.length > 0) {
      const files = generateFullProject(collections, projectName)
      return Object.entries(files)
        .map(([path, content]) => `// ${path}\n${content}`)
        .join('\n\n// ========================================\n\n')
    }

    const col = collections.find(c => c.id === selectedCollection)
    if (col) {
      return generateSchemaCode(col, collections)
    }

    return '// Add collections to see generated code'
  }, [selectedCollection, collections, projectName])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(currentCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = async () => {
    if (selectedCollection) {
      const col = collections.find(c => c.id === selectedCollection)
      if (col) {
        const blob = new Blob([currentCode], { type: 'text/javascript' })
        saveAs(blob, `${col.data.name.toLowerCase()}.model.js`)
      }
    } else {
      const files = generateFullProject(collections, projectName)
      const zip = new JSZip()
      Object.entries(files).forEach(([path, content]) => {
        zip.file(path, content)
      })
      const blob = await zip.generateAsync({ type: 'blob' })
      saveAs(blob, `${projectName.replace(/\s+/g, '_')}_mongoose.zip`)
    }
  }

  return (
    <div className="absolute top-0 right-0 bottom-0 w-[520px] bg-[var(--bg-surface)] border-l border-[var(--border)] flex flex-col z-40 animate-slide-right">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
            <Code2 size={18} className="text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--text-primary)]">Generated Code</h3>
            <p className="text-xs text-[var(--text-muted)]">Mongoose schemas</p>
          </div>
        </div>
        <button
          onClick={() => setShowCodePanel(false)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all"
        >
          <X size={18} />
        </button>
      </div>

      <div className="px-5 py-4 border-b border-[var(--border)]">
        <div className="relative">
          <select
            value={selectedCollection || ''}
            onChange={(e) => setSelectedCollection(e.target.value || null)}
            className="w-full h-10 px-4 pr-10 rounded-xl text-sm cursor-pointer appearance-none bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2371717a' viewBox='0 0 16 16'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center'
            }}
          >
            <option value="">All Files (Combined)</option>
            {collections.map((col) => (
              <option key={col.id} value={col.id}>
                {col.data.name}.model.js
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-5">
        {collections.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--bg-elevated)] flex items-center justify-center mb-4">
              <FileCode size={28} className="text-[var(--text-muted)]" />
            </div>
            <p className="text-[var(--text-secondary)] font-medium">No collections yet</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">Add a collection to see generated code</p>
          </div>
        ) : (
          <div className="relative bg-[var(--bg-base)] rounded-xl border border-[var(--border)] overflow-hidden">
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-elevated)]/90 backdrop-blur-sm text-[var(--text-muted)] border border-[var(--border)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
              title="Copy code"
            >
              {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <Highlight theme={themes.nightOwl} code={currentCode} language="javascript">
              {({ className, style, tokens, getLineProps, getTokenProps }) => (
                <pre
                  className="text-sm font-mono leading-relaxed overflow-x-auto p-4 pt-10"
                  style={{ ...style, background: 'transparent' }}
                >
                  {tokens.map((line, i) => (
                    <div key={i} {...getLineProps({ line })} className="table-row">
                      <span className="table-cell w-10 pr-4 text-right text-[var(--text-muted)] select-none text-xs opacity-50">
                        {i + 1}
                      </span>
                      <span className="table-cell">
                        {line.map((token, key) => (
                          <span key={key} {...getTokenProps({ token })} />
                        ))}
                      </span>
                    </div>
                  ))}
                </pre>
              )}
            </Highlight>
          </div>
        )}
      </div>

      <div className="px-5 py-4 border-t border-[var(--border)] flex gap-3">
        <button
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-medium bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-all"
        >
          {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
          {copied ? 'Copied!' : 'Copy Code'}
        </button>
        <button
          onClick={handleDownload}
          className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/25 transition-all"
        >
          <Download size={16} />
          Download
        </button>
      </div>
    </div>
  )
}

export default CodePanel
