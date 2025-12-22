import React, { useState, useRef } from 'react'
import {
  Save, Download, Upload, Code, Trash2, FileJson, Package,
  ChevronDown, Loader2, Check, Zap, Menu, PanelLeftClose
} from 'lucide-react'
import { saveAs } from 'file-saver'
import JSZip from 'jszip'
import useStore from '../stores/useStore'
import { saveProject, exportProjectAsJSON, importProjectFromJSON } from '../utils/storage'
import { generateFullProject } from '../generators/mongooseGenerator'

const Header = ({ sidebarOpen, onToggleSidebar }) => {
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const fileInputRef = useRef(null)

  const {
    nodes,
    projectName,
    projectId,
    setProjectName,
    setProjectId,
    getProjectData,
    loadProjectData,
    toggleCodePanel,
    showCodePanel,
    clearProject
  } = useStore()

  const handleSave = async () => {
    setSaving(true)
    try {
      const data = getProjectData()
      const savedId = await saveProject(data)
      if (!projectId) {
        setProjectId(savedId)
      }
      window.dispatchEvent(new CustomEvent('schemaUpdated'))
      setSaved(true)
      setTimeout(() => {
        setSaving(false)
        setSaved(false)
      }, 1500)
    } catch (error) {
      console.error('Save failed:', error)
      setSaving(false)
    }
  }

  const handleExportJSON = () => {
    const data = getProjectData()
    const blob = exportProjectAsJSON(data)
    saveAs(blob, `${projectName.replace(/\s+/g, '_')}.json`)
    setShowExportMenu(false)
  }

  const handleImportJSON = async (e) => {
    const file = e.target.files[0]
    if (file) {
      try {
        const project = await importProjectFromJSON(file)
        loadProjectData(project)
      } catch (error) {
        alert('Failed to import: ' + error.message)
      }
    }
    e.target.value = ''
  }

  const handleExportMongoose = async () => {
    const files = generateFullProject(nodes, projectName)
    const zip = new JSZip()
    Object.entries(files).forEach(([path, content]) => {
      zip.file(path, content)
    })
    const blob = await zip.generateAsync({ type: 'blob' })
    saveAs(blob, `${projectName.replace(/\s+/g, '_')}_mongoose.zip`)
    setShowExportMenu(false)
  }

  const handleClear = () => {
    if (confirm('Clear entire project? This cannot be undone.')) {
      clearProject()
    }
  }

  return (
    <header className="h-14 bg-[var(--bg-surface)]/80 backdrop-blur-xl border-b border-[var(--border)] flex items-center px-4 gap-4 z-50">
      <div className="flex items-center gap-3 flex-1">
        <button
          onClick={onToggleSidebar}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all"
          title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {sidebarOpen ? <PanelLeftClose size={18} /> : <Menu size={18} />}
        </button>

        <div className="w-px h-6 bg-[var(--border)]" />

        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="bg-transparent border-none text-[var(--text-primary)] text-sm font-medium focus:outline-none w-48 px-2 py-1 rounded hover:bg-[var(--bg-elevated)] transition-all"
          placeholder="Untitled Database"
        />
        <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] bg-[var(--bg-elevated)] px-2 py-1 rounded-md">
          <Zap size={10} className="text-[var(--accent-primary)]" />
          {nodes.length} collection{nodes.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-all"
        >
          {saving ? (
            saved ? <Check size={15} className="text-green-400" /> : <Loader2 size={15} className="animate-spin" />
          ) : (
            <Save size={15} />
          )}
          <span className="hidden sm:inline">{saved ? 'Saved!' : 'Save'}</span>
        </button>

        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-all"
          >
            <Download size={15} />
            <span className="hidden sm:inline">Export</span>
            <ChevronDown size={12} />
          </button>

          {showExportMenu && (
            <div className="absolute top-full mt-2 right-0 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl shadow-2xl w-56 overflow-hidden z-50 animate-fade-in">
              <button
                onClick={handleExportJSON}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-hover)] transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                  <FileJson size={16} className="text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">Export JSON</p>
                  <p className="text-[10px] text-[var(--text-muted)]">Project backup</p>
                </div>
              </button>
              <div className="h-px bg-[var(--border)]" />
              <button
                onClick={handleExportMongoose}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-hover)] transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                  <Package size={16} className="text-emerald-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">Export Mongoose</p>
                  <p className="text-[10px] text-[var(--text-muted)]">Schema files (.zip)</p>
                </div>
              </button>
            </div>
          )}
        </div>

        <label className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm cursor-pointer bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-all">
          <Upload size={15} />
          <span className="hidden sm:inline">Import</span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportJSON}
            className="hidden"
          />
        </label>

        <div className="w-px h-6 bg-[var(--border)] mx-1" />

        <button
          onClick={toggleCodePanel}
          className={`flex items-center gap-2 h-9 px-4 rounded-lg text-sm transition-all ${
            showCodePanel
              ? 'bg-[var(--accent-primary)] text-white'
              : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Code size={15} />
          <span className="hidden sm:inline">Code</span>
        </button>

        <button
          onClick={handleClear}
          className="flex items-center justify-center h-9 w-9 rounded-lg bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)] hover:text-red-400 hover:border-red-400/50 hover:bg-red-500/10 transition-all"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {showExportMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowExportMenu(false)}
        />
      )}
    </header>
  )
}

export default Header
