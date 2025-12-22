import React, { useState, useEffect, useCallback } from 'react'
import {
  Database, Plus, Trash2, Search, Folder, Clock,
  Settings, Layers, MoreHorizontal, X, FileText, GitBranch
} from 'lucide-react'
import useStore from '../stores/useStore'
import { getAllProjects, loadProject, deleteProject, saveProject } from '../utils/storage'

const Sidebar = ({ onClose }) => {
  const [projects, setProjects] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [contextMenu, setContextMenu] = useState(null)
  const [showNewModal, setShowNewModal] = useState(false)
  const [newSchemaName, setNewSchemaName] = useState('')

  const {
    projectName,
    loadProjectData,
    clearProject,
    setProjectName,
    getProjectData,
    nodes,
    openAggregationBuilder
  } = useStore()

  const loadProjects = useCallback(async () => {
    setLoading(true)
    try {
      const allProjects = await getAllProjects()
      setProjects(allProjects)
    } catch (error) {
      console.error('Failed to load projects:', error)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  useEffect(() => {
    const handleStorageChange = () => {
      loadProjects()
    }
    window.addEventListener('schemaUpdated', handleStorageChange)
    return () => window.removeEventListener('schemaUpdated', handleStorageChange)
  }, [loadProjects])

  const handleCreateNew = () => {
    setNewSchemaName('')
    setShowNewModal(true)
  }

  const handleConfirmCreate = async () => {
    const name = newSchemaName.trim() || 'Untitled Database'
    clearProject()
    setProjectName(name)
    setShowNewModal(false)
    setNewSchemaName('')
  }

  const handleLoadProject = async (id) => {
    const project = await loadProject(id)
    if (project) {
      loadProjectData(project)
    }
  }

  const handleDeleteProject = async (id, e) => {
    e.stopPropagation()
    await deleteProject(id)
    await loadProjects()
    setContextMenu(null)
  }

  const filteredProjects = projects.filter(p =>
    p.projectName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="w-64 h-full bg-[var(--bg-surface)] border-r border-[var(--border)] flex flex-col animate-slide-left">
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Layers size={18} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm gradient-text">DB Studio</h1>
              <p className="text-[10px] text-[var(--text-muted)]">MongoDB Designer</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleCreateNew}
          className="w-full flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/25 transition-all"
        >
          <Plus size={16} />
          New Database
        </button>
      </div>

      <div className="px-3 pt-3 pb-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search databases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg text-sm bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
          />
        </div>
      </div>

      <div className="px-3 pt-2 pb-3 border-b border-[var(--border)]">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-1">
          Current Workspace
        </span>
        <div className="mt-2 p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--accent-primary)]/30">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500/30 to-purple-600/30 flex items-center justify-center">
              <FileText size={12} className="text-[var(--accent-primary)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                {projectName}
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">
                {nodes.length} collection{nodes.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pt-2">
        <div className="px-2 py-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Saved Databases ({filteredProjects.length})
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-6 px-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--bg-elevated)] flex items-center justify-center mx-auto mb-3">
              <Folder size={20} className="text-[var(--text-muted)]" />
            </div>
            <p className="text-sm text-[var(--text-secondary)]">No databases found</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Create your first database to get started</p>
          </div>
        ) : (
          <div className="space-y-1 pb-2">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => handleLoadProject(project.id)}
                className="group relative flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-[var(--bg-elevated)] transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center flex-shrink-0">
                  <Database size={14} className="text-[var(--accent-primary)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {project.projectName}
                  </p>
                  <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
                    <Clock size={10} />
                    {formatDate(project.updatedAt)}
                    <span className="mx-0.5">•</span>
                    {project.nodes?.length || 0} cols
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setContextMenu(contextMenu === project.id ? null : project.id)
                  }}
                  className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] transition-all"
                >
                  <MoreHorizontal size={14} className="text-[var(--text-muted)]" />
                </button>

                {contextMenu === project.id && (
                  <div className="absolute right-2 top-full mt-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg shadow-xl z-50 py-1 min-w-[160px] animate-fade-in">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleLoadProject(project.id)
                        openAggregationBuilder()
                        setContextMenu(null)
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
                    >
                      <GitBranch size={14} className="text-violet-400" />
                      Create Aggregation
                    </button>
                    <div className="h-px bg-[var(--border)] my-1" />
                    <button
                      onClick={(e) => handleDeleteProject(project.id, e)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-[var(--border)]">
        <button
          onClick={loadProjects}
          className="w-full flex items-center justify-center gap-2 h-9 rounded-lg text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all"
        >
          <Settings size={14} />
          Refresh
        </button>
      </div>

      {contextMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setContextMenu(null)}
        />
      )}

      {showNewModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center" onClick={() => setShowNewModal(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">New Database</h3>
              <button
                onClick={() => setShowNewModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Database Name
              </label>
              <input
                type="text"
                value={newSchemaName}
                onChange={(e) => setNewSchemaName(e.target.value)}
                placeholder="Enter database name..."
                className="w-full h-11 px-4 rounded-xl text-sm bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleConfirmCreate()}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowNewModal(false)}
                className="flex-1 h-10 rounded-xl text-sm font-medium bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCreate}
                className="flex-1 h-10 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/25 transition-all"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Sidebar
