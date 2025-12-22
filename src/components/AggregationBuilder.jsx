import React, { useState, useMemo } from 'react'
import {
  X, Plus, Save, Copy, Trash2, ChevronDown, ChevronUp, Play,
  GripVertical, Eye, EyeOff, Database, GitBranch, Filter,
  Layers, ArrowDownUp, Hash, Scissors, Link2, FolderPlus,
  FileText, Code, Check, AlertCircle, ChevronRight, Sparkles
} from 'lucide-react'
import useStore from '../stores/useStore'
import { saveProject } from '../utils/storage'
import {
  collectionToSchema,
  getFieldsBeforeStage,
  getSchemaAtStage,
  schemaToFieldNames,
  flattenSchemaForDisplay,
  getFieldTypeLabel,
  getFieldTypeColor
} from '../utils/schemaTracker'

const STAGE_TYPES = [
  { type: '$match', label: 'Match', icon: Filter, color: 'text-emerald-400', description: 'Filter documents' },
  { type: '$group', label: 'Group', icon: Layers, color: 'text-blue-400', description: 'Group by field' },
  { type: '$project', label: 'Project', icon: FileText, color: 'text-violet-400', description: 'Shape output' },
  { type: '$sort', label: 'Sort', icon: ArrowDownUp, color: 'text-amber-400', description: 'Order results' },
  { type: '$limit', label: 'Limit', icon: Hash, color: 'text-pink-400', description: 'Limit count' },
  { type: '$skip', label: 'Skip', icon: Scissors, color: 'text-orange-400', description: 'Skip documents' },
  { type: '$unwind', label: 'Unwind', icon: GitBranch, color: 'text-cyan-400', description: 'Flatten arrays' },
  { type: '$lookup', label: 'Lookup', icon: Link2, color: 'text-purple-400', description: 'Join collections' },
  { type: '$addFields', label: 'Add Fields', icon: FolderPlus, color: 'text-teal-400', description: 'Add new fields' },
  { type: '$count', label: 'Count', icon: Hash, color: 'text-rose-400', description: 'Count documents' },
]

const OPERATORS = [
  { value: '$eq', label: 'equals' },
  { value: '$ne', label: 'not equals' },
  { value: '$gt', label: 'greater than' },
  { value: '$gte', label: 'greater or equal' },
  { value: '$lt', label: 'less than' },
  { value: '$lte', label: 'less or equal' },
  { value: '$in', label: 'in array' },
  { value: '$nin', label: 'not in array' },
  { value: '$exists', label: 'exists' },
  { value: '$regex', label: 'matches regex' },
]

const ACCUMULATORS = [
  { value: '$sum', label: 'Sum' },
  { value: '$avg', label: 'Average' },
  { value: '$min', label: 'Min' },
  { value: '$max', label: 'Max' },
  { value: '$first', label: 'First' },
  { value: '$last', label: 'Last' },
  { value: '$push', label: 'Push to Array' },
  { value: '$addToSet', label: 'Add to Set' },
  { value: '$count', label: 'Count' },
]

const AggregationBuilder = () => {
  const [selectedStageId, setSelectedStageId] = useState(null)
  const [showStageMenu, setShowStageMenu] = useState(false)
  const [showJsonMode, setShowJsonMode] = useState(false)
  const [jsonError, setJsonError] = useState(null)
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)

  const {
    nodes,
    aggregations,
    currentAggregation,
    showAggregationBuilder,
    closeAggregationBuilder,
    openAggregationBuilder,
    saveAggregation,
    setCurrentAggregation,
    addStage,
    updateStage,
    deleteStage,
    reorderStages,
    loadAggregation,
    deleteAggregation,
    duplicateAggregation,
    getProjectData,
    projectId
  } = useStore()

  const collections = useMemo(() => 
    nodes.map(n => ({ id: n.id, name: n.data.name, fields: n.data.fields })),
    [nodes]
  )

  const selectedCollection = useMemo(() => {
    if (!currentAggregation?.sourceCollection) return null
    return collections.find(c => c.name === currentAggregation.sourceCollection || c.id === currentAggregation.sourceCollection)
  }, [currentAggregation?.sourceCollection, collections])

  const baseSchema = useMemo(() => {
    if (!selectedCollection) return []
    return collectionToSchema(selectedCollection)
  }, [selectedCollection])

  const availableFields = useMemo(() => {
    return schemaToFieldNames(baseSchema)
  }, [baseSchema])

  const getSchemaForStage = (stageIndex) => {
    if (!currentAggregation) return []
    return getSchemaAtStage(stageIndex, currentAggregation.stages, baseSchema, collections)
  }

  const getFieldsForStage = (stageIndex) => {
    if (!currentAggregation) return []
    const schema = getFieldsBeforeStage(stageIndex, currentAggregation.stages, baseSchema, collections)
    return schemaToFieldNames(schema)
  }

  const selectedStageIndex = currentAggregation?.stages.findIndex(s => s.id === selectedStageId) ?? -1

  const pipelineJson = useMemo(() => {
    if (!currentAggregation) return '[]'
    return JSON.stringify(
      currentAggregation.stages
        .filter(s => s.enabled)
        .map(s => ({ [s.type]: stageConfigToMongo(s.type, s.config) })),
      null,
      2
    )
  }, [currentAggregation])

  if (!showAggregationBuilder) return null

  const handleSave = async () => {
    saveAggregation()
    const projectData = getProjectData()
    if (projectId) {
      await saveProject({ ...projectData, id: projectId })
      window.dispatchEvent(new Event('schemaUpdated'))
    }
  }

  const handleClose = () => {
    closeAggregationBuilder()
    setSelectedStageId(null)
  }

  const handleAddStage = (type) => {
    addStage(type)
    setShowStageMenu(false)
  }

  const handleMoveStage = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex >= 0 && newIndex < currentAggregation.stages.length) {
      reorderStages(index, newIndex)
    }
  }

  const handleDragStart = (e, index) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', index.toString())
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDropZoneDragEnter = (e, dropZoneIndex) => {
    e.preventDefault()
    if (draggedIndex !== null && dropZoneIndex !== draggedIndex && dropZoneIndex !== draggedIndex + 1) {
      setDragOverIndex(dropZoneIndex)
    }
  }

  const handleDropZoneDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDropZoneDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverIndex(null)
    }
  }

  const handleDropZoneDrop = (e, dropZoneIndex) => {
    e.preventDefault()
    if (draggedIndex !== null) {
      let targetIndex
      if (dropZoneIndex <= draggedIndex) {
        targetIndex = dropZoneIndex
      } else {
        targetIndex = dropZoneIndex - 1
      }
      if (targetIndex !== draggedIndex) {
        reorderStages(draggedIndex, targetIndex)
      }
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const selectedStage = currentAggregation?.stages.find(s => s.id === selectedStageId)

  return (
    <div className="fixed inset-0 z-[100] flex">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />
      
      <div className="relative flex w-full h-full max-w-[1400px] mx-auto my-4 gap-0 animate-slide-up">
        {/* Saved Aggregations Sidebar */}
        <div className="w-64 bg-[var(--bg-surface)] border border-[var(--border)] rounded-l-2xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-2 mb-3">
              <GitBranch size={18} className="text-violet-400" />
              <h3 className="font-semibold text-[var(--text-primary)]">Aggregations</h3>
            </div>
            <button
              onClick={() => {
                openAggregationBuilder(collections[0]?.name || null)
                setSelectedStageId(null)
              }}
              className="w-full flex items-center justify-center gap-2 h-9 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 transition-all"
            >
              <Plus size={14} />
              New Aggregation
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {aggregations.length === 0 ? (
              <div className="text-center py-8 px-4">
                <GitBranch size={24} className="text-[var(--text-muted)] mx-auto mb-2" />
                <p className="text-sm text-[var(--text-muted)]">No saved aggregations</p>
              </div>
            ) : (
              <div className="space-y-1">
                {aggregations.map(agg => (
                  <div
                    key={agg.id}
                    onClick={() => loadAggregation(agg.id)}
                    className={`group relative p-3 rounded-lg cursor-pointer transition-all ${
                      currentAggregation?.id === agg.id
                        ? 'bg-violet-500/20 border border-violet-500/30'
                        : 'hover:bg-[var(--bg-elevated)]'
                    }`}
                  >
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{agg.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {agg.stages.length} stage{agg.stages.length !== 1 ? 's' : ''} • {agg.sourceCollection || 'No collection'}
                    </p>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={(e) => { e.stopPropagation(); duplicateAggregation(agg.id) }}
                        className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-muted)]"
                        title="Duplicate"
                      >
                        <Copy size={12} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteAggregation(agg.id) }}
                        className="p-1.5 rounded-md hover:bg-red-500/20 text-red-400"
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Pipeline Editor */}
        <div className="flex-1 bg-[var(--bg-primary)] border-y border-[var(--border)] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-surface)]">
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={currentAggregation?.name || ''}
                onChange={(e) => setCurrentAggregation({ ...currentAggregation, name: e.target.value })}
                className="text-lg font-semibold bg-transparent border-none outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                placeholder="Aggregation Name"
              />
              <select
                value={currentAggregation?.sourceCollection || ''}
                onChange={(e) => setCurrentAggregation({ ...currentAggregation, sourceCollection: e.target.value })}
                className="h-8 px-3 rounded-lg text-sm bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              >
                <option value="">Select Collection</option>
                {collections.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowJsonMode(!showJsonMode)}
                className={`flex items-center gap-2 h-8 px-3 rounded-lg text-sm transition-all ${
                  showJsonMode 
                    ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' 
                    : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Code size={14} />
                JSON
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 h-8 px-4 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 transition-all"
              >
                <Save size={14} />
                Save
              </button>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Pipeline Canvas */}
          <div className="flex-1 overflow-y-auto p-6">
            {showJsonMode ? (
              <div className="h-full">
                <pre className="h-full p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] text-sm text-[var(--text-primary)] overflow-auto font-mono">
                  {pipelineJson}
                </pre>
              </div>
            ) : (
              <div className="max-w-xl mx-auto space-y-3">
                {/* Input Collection Card */}
                <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-violet-500/30">
                  <Database size={20} className="text-violet-400" />
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">Input Collection</p>
                    <p className="text-xs text-[var(--text-muted)]">{currentAggregation?.sourceCollection || 'Select a collection'}</p>
                  </div>
                </div>

                {/* Pipeline connection line */}
                {currentAggregation?.stages.length > 0 && (
                  <div className="flex justify-center">
                    <div className="w-0.5 h-4 bg-[var(--border)]" />
                  </div>
                )}

                {/* Stages with Drop Zones */}
                {currentAggregation?.stages.map((stage, index) => {
                  const stageInfo = STAGE_TYPES.find(s => s.type === stage.type)
                  const Icon = stageInfo?.icon || Filter
                  const isDragging = draggedIndex === index
                  const isDropZoneActive = dragOverIndex === index
                  const stageOutputSchema = getSchemaForStage(index)
                  const newFieldsCount = stageOutputSchema.filter(f => f.isNew && f.fromStage === index).length
                  
                  return (
                    <React.Fragment key={stage.id}>
                      {/* Drop zone before this stage */}
                      {draggedIndex !== null && (
                        <div
                          onDragEnter={(e) => handleDropZoneDragEnter(e, index)}
                          onDragOver={handleDropZoneDragOver}
                          onDragLeave={handleDropZoneDragLeave}
                          onDrop={(e) => handleDropZoneDrop(e, index)}
                          className={`h-3 -my-1 mx-4 rounded transition-all ${
                            isDropZoneActive 
                              ? 'bg-violet-500/40 border-2 border-dashed border-violet-400 h-12' 
                              : 'bg-transparent'
                          }`}
                        />
                      )}
                      
                      <div
                        onClick={() => setSelectedStageId(stage.id)}
                        className={`group relative p-4 rounded-xl border transition-all cursor-pointer ${
                          selectedStageId === stage.id
                            ? 'bg-[var(--bg-surface)] border-[var(--accent-primary)] shadow-lg shadow-violet-500/10'
                            : 'bg-[var(--bg-surface)] border-[var(--border)] hover:border-[var(--border-hover)]'
                        } ${!stage.enabled ? 'opacity-50' : ''} ${isDragging ? 'opacity-40 scale-95' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragEnd={handleDragEnd}
                            className="cursor-grab active:cursor-grabbing p-1 -m-1 rounded hover:bg-[var(--bg-hover)]"
                          >
                            <GripVertical size={16} className="text-[var(--text-muted)]" />
                          </div>
                          <div className={`w-8 h-8 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center ${stageInfo?.color || 'text-gray-400'}`}>
                            <Icon size={16} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-[var(--text-primary)]">{stageInfo?.label || stage.type}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-[var(--text-muted)]">{stageInfo?.description}</p>
                              {stage.enabled && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-muted)]">
                                  {stageOutputSchema.length} fields
                                </span>
                              )}
                              {newFieldsCount > 0 && stage.enabled && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                                  +{newFieldsCount} new
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all" draggable={false}>
                            <button
                              draggable={false}
                              onClick={(e) => { e.stopPropagation(); updateStage(stage.id, { enabled: !stage.enabled }) }}
                              className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-muted)]"
                              title={stage.enabled ? 'Disable' : 'Enable'}
                            >
                              {stage.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
                            </button>
                            <button
                              draggable={false}
                              onClick={(e) => { e.stopPropagation(); handleMoveStage(index, 'up') }}
                              className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-muted)] disabled:opacity-30"
                              disabled={index === 0}
                            >
                              <ChevronUp size={14} />
                            </button>
                            <button
                              draggable={false}
                              onClick={(e) => { e.stopPropagation(); handleMoveStage(index, 'down') }}
                              className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-muted)] disabled:opacity-30"
                              disabled={index === currentAggregation.stages.length - 1}
                            >
                              <ChevronDown size={14} />
                            </button>
                            <button
                              draggable={false}
                              onClick={(e) => { e.stopPropagation(); deleteStage(stage.id) }}
                              className="p-1.5 rounded-md hover:bg-red-500/20 text-red-400"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {index < currentAggregation.stages.length - 1 && draggedIndex === null && (
                        <div className="flex justify-center">
                          <div className="w-0.5 h-4 bg-[var(--border)]" />
                        </div>
                      )}
                    </React.Fragment>
                  )
                })}
                
                {/* Final drop zone after last stage */}
                {draggedIndex !== null && currentAggregation?.stages.length > 0 && (
                  <div
                    onDragEnter={(e) => handleDropZoneDragEnter(e, currentAggregation.stages.length)}
                    onDragOver={handleDropZoneDragOver}
                    onDragLeave={handleDropZoneDragLeave}
                    onDrop={(e) => handleDropZoneDrop(e, currentAggregation.stages.length)}
                    className={`h-3 -my-1 mx-4 rounded transition-all ${
                      dragOverIndex === currentAggregation.stages.length 
                        ? 'bg-violet-500/40 border-2 border-dashed border-violet-400 h-12' 
                        : 'bg-transparent'
                    }`}
                  />
                )}

                {/* Add Stage Button */}
                <div className="relative">
                  {currentAggregation?.stages.length > 0 && (
                    <div className="flex justify-center mb-3">
                      <div className="w-0.5 h-4 bg-[var(--border)]" />
                    </div>
                  )}
                  <button
                    onClick={() => setShowStageMenu(!showStageMenu)}
                    className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-[var(--border)] rounded-xl text-sm text-[var(--text-muted)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5 transition-all"
                  >
                    <Plus size={16} />
                    Add Stage
                  </button>

                  {showStageMenu && (
                    <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-xl z-10 grid grid-cols-2 gap-1">
                      {STAGE_TYPES.map(({ type, label, icon: Icon, color, description }) => (
                        <button
                          key={type}
                          onClick={() => handleAddStage(type)}
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-all text-left"
                        >
                          <div className={`w-7 h-7 rounded-md bg-[var(--bg-elevated)] flex items-center justify-center ${color}`}>
                            <Icon size={14} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>
                            <p className="text-[10px] text-[var(--text-muted)]">{description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Stage Config & Preview */}
        <div className="w-80 bg-[var(--bg-surface)] border border-[var(--border)] rounded-r-2xl flex flex-col overflow-hidden">
          {selectedStage ? (
            <StageConfigPanel
              stage={selectedStage}
              stageIndex={selectedStageIndex}
              collections={collections}
              availableFields={getFieldsForStage(selectedStageIndex)}
              outputSchema={getSchemaForStage(selectedStageIndex)}
              baseSchema={baseSchema}
              allStages={currentAggregation?.stages || []}
              onUpdate={(updates) => updateStage(selectedStage.id, updates)}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <Filter size={32} className="text-[var(--text-muted)] mx-auto mb-3" />
                <p className="text-sm text-[var(--text-muted)]">Select a stage to configure</p>
              </div>
            </div>
          )}

          {/* Output Preview */}
          <div className="border-t border-[var(--border)] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Play size={14} className="text-emerald-400" />
              <span className="text-sm font-medium text-[var(--text-primary)]">Pipeline Preview</span>
            </div>
            <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]">
              <p className="text-xs text-[var(--text-muted)] mb-2">
                {currentAggregation?.stages.filter(s => s.enabled).length || 0} active stage(s)
              </p>
              <button
                onClick={() => navigator.clipboard.writeText(pipelineJson)}
                className="w-full flex items-center justify-center gap-2 h-8 rounded-lg text-xs font-medium bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] transition-all"
              >
                <Copy size={12} />
                Copy Pipeline JSON
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const SchemaPreview = ({ schema, title = "Output Fields" }) => {
  const [expanded, setExpanded] = useState(true)
  const flatSchema = flattenSchemaForDisplay(schema)

  return (
    <div className="border-t border-[var(--border)]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-[var(--bg-elevated)] transition-all"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-violet-400" />
          <span className="text-xs font-medium text-[var(--text-primary)]">{title}</span>
          <span className="text-xs text-[var(--text-muted)]">({schema.length} fields)</span>
        </div>
        <ChevronRight size={14} className={`text-[var(--text-muted)] transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>
      {expanded && (
        <div className="px-3 pb-3 max-h-48 overflow-y-auto">
          <div className="space-y-0.5">
            {flatSchema.map((field, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-[var(--bg-elevated)] group"
                style={{ paddingLeft: `${8 + field.depth * 12}px` }}
              >
                {field.hasChildren && (
                  <ChevronRight size={10} className="text-[var(--text-muted)]" />
                )}
                <span className="text-xs text-[var(--text-primary)] flex-1">{field.displayName}</span>
                <span className={`text-[10px] ${getFieldTypeColor(field.type)}`}>
                  {getFieldTypeLabel(field.type)}
                </span>
                {field.isNew && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">NEW</span>
                )}
              </div>
            ))}
            {flatSchema.length === 0 && (
              <p className="text-xs text-[var(--text-muted)] py-2 text-center">No fields available</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const StageConfigPanel = ({ stage, stageIndex, collections, availableFields, outputSchema, baseSchema, allStages, onUpdate }) => {
  const stageInfo = STAGE_TYPES.find(s => s.type === stage.type)
  const Icon = stageInfo?.icon || Filter

  const updateConfig = (key, value) => {
    onUpdate({ config: { ...stage.config, [key]: value } })
  }

  const inputSchema = stageIndex === 0 
    ? baseSchema 
    : getSchemaAtStage(stageIndex - 1, allStages, baseSchema, collections)

  return (
    <div className="flex-1 overflow-y-auto flex flex-col">
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-[var(--bg-elevated)] flex items-center justify-center ${stageInfo?.color || 'text-gray-400'}`}>
            <Icon size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--text-primary)]">{stageInfo?.label}</h3>
            <p className="text-xs text-[var(--text-muted)]">{stageInfo?.description}</p>
          </div>
        </div>
      </div>

      <SchemaPreview schema={inputSchema} title="Input Fields" />

      <div className="flex-1 p-4 space-y-4">
        {stage.type === '$match' && (
          <MatchConfig config={stage.config} availableFields={availableFields} schema={inputSchema} updateConfig={updateConfig} />
        )}
        {stage.type === '$group' && (
          <GroupConfig config={stage.config} availableFields={availableFields} schema={inputSchema} updateConfig={updateConfig} />
        )}
        {stage.type === '$project' && (
          <ProjectConfig config={stage.config} availableFields={availableFields} schema={inputSchema} updateConfig={updateConfig} />
        )}
        {stage.type === '$sort' && (
          <SortConfig config={stage.config} availableFields={availableFields} schema={inputSchema} updateConfig={updateConfig} />
        )}
        {stage.type === '$limit' && (
          <LimitConfig config={stage.config} updateConfig={updateConfig} />
        )}
        {stage.type === '$skip' && (
          <SkipConfig config={stage.config} updateConfig={updateConfig} />
        )}
        {stage.type === '$unwind' && (
          <UnwindConfig config={stage.config} availableFields={availableFields} schema={inputSchema} updateConfig={updateConfig} />
        )}
        {stage.type === '$lookup' && (
          <LookupConfig config={stage.config} collections={collections} availableFields={availableFields} schema={inputSchema} updateConfig={updateConfig} />
        )}
        {stage.type === '$addFields' && (
          <AddFieldsConfig config={stage.config} availableFields={availableFields} schema={inputSchema} updateConfig={updateConfig} />
        )}
        {stage.type === '$count' && (
          <CountConfig config={stage.config} updateConfig={updateConfig} />
        )}
      </div>

      <SchemaPreview schema={outputSchema} title="Output Fields" />
    </div>
  )
}

const MatchConfig = ({ config, availableFields, updateConfig }) => {
  const conditions = config.conditions || []

  const addCondition = () => {
    updateConfig('conditions', [...conditions, { field: '', operator: '$eq', value: '' }])
  }

  const updateCondition = (index, updates) => {
    const newConditions = [...conditions]
    newConditions[index] = { ...newConditions[index], ...updates }
    updateConfig('conditions', newConditions)
  }

  const removeCondition = (index) => {
    updateConfig('conditions', conditions.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Conditions</label>
      {conditions.map((cond, index) => (
        <div key={index} className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] space-y-2">
          <div className="flex items-center gap-2">
            <select
              value={cond.field}
              onChange={(e) => updateCondition(index, { field: e.target.value })}
              className="flex-1 h-8 px-2 rounded-md text-sm bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)]"
            >
              <option value="">Select field</option>
              {availableFields.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <button onClick={() => removeCondition(index)} className="p-1 text-red-400 hover:bg-red-500/20 rounded">
              <Trash2 size={14} />
            </button>
          </div>
          <div className="flex gap-2">
            <select
              value={cond.operator}
              onChange={(e) => updateCondition(index, { operator: e.target.value })}
              className="w-1/2 h-8 px-2 rounded-md text-sm bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)]"
            >
              {OPERATORS.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
            </select>
            <input
              type="text"
              value={cond.value}
              onChange={(e) => updateCondition(index, { value: e.target.value })}
              placeholder="Value"
              className="w-1/2 h-8 px-2 rounded-md text-sm bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)]"
            />
          </div>
        </div>
      ))}
      <button onClick={addCondition} className="w-full py-2 text-sm text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 rounded-lg transition-all">
        + Add Condition
      </button>
    </div>
  )
}

const GroupConfig = ({ config, availableFields, updateConfig }) => {
  const accumulators = config.accumulators || []

  const addAccumulator = () => {
    updateConfig('accumulators', [...accumulators, { field: '', accumulator: '$sum', sourceField: '' }])
  }

  const updateAccumulator = (index, updates) => {
    const newAccs = [...accumulators]
    newAccs[index] = { ...newAccs[index], ...updates }
    updateConfig('accumulators', newAccs)
  }

  const removeAccumulator = (index) => {
    updateConfig('accumulators', accumulators.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-2">Group By (_id)</label>
        <select
          value={config._id || ''}
          onChange={(e) => updateConfig('_id', e.target.value)}
          className="w-full h-9 px-3 rounded-lg text-sm bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)]"
        >
          <option value="">Select field</option>
          <option value="null">null (count all)</option>
          {availableFields.map(f => <option key={f} value={`$${f}`}>${f}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-2">Accumulators</label>
        {accumulators.map((acc, index) => (
          <div key={index} className="p-3 mb-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={acc.field}
                onChange={(e) => updateAccumulator(index, { field: e.target.value })}
                placeholder="Output field name"
                className="flex-1 h-8 px-2 rounded-md text-sm bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)]"
              />
              <button onClick={() => removeAccumulator(index)} className="p-1 text-red-400 hover:bg-red-500/20 rounded">
                <Trash2 size={14} />
              </button>
            </div>
            <div className="flex gap-2">
              <select
                value={acc.accumulator}
                onChange={(e) => updateAccumulator(index, { accumulator: e.target.value })}
                className="w-1/2 h-8 px-2 rounded-md text-sm bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)]"
              >
                {ACCUMULATORS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
              <select
                value={acc.sourceField}
                onChange={(e) => updateAccumulator(index, { sourceField: e.target.value })}
                className="w-1/2 h-8 px-2 rounded-md text-sm bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)]"
              >
                <option value="">Select field</option>
                <option value="1">1 (for count)</option>
                {availableFields.map(f => <option key={f} value={`$${f}`}>${f}</option>)}
              </select>
            </div>
          </div>
        ))}
        <button onClick={addAccumulator} className="w-full py-2 text-sm text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 rounded-lg transition-all">
          + Add Accumulator
        </button>
      </div>
    </div>
  )
}

const ProjectConfig = ({ config, availableFields, schema, updateConfig }) => {
  const fields = config.fields || {}
  const [showAddField, setShowAddField] = useState(false)
  const [newFieldName, setNewFieldName] = useState('')
  const [newFieldExpr, setNewFieldExpr] = useState('')
  const flatSchema = flattenSchemaForDisplay(schema)

  const toggleField = (fieldName) => {
    const newFields = { ...fields }
    if (newFields[fieldName] !== undefined) {
      delete newFields[fieldName]
    } else {
      newFields[fieldName] = 1
    }
    updateConfig('fields', newFields)
  }

  const addCustomField = () => {
    if (newFieldName) {
      const newFields = { ...fields, [newFieldName]: newFieldExpr || 1 }
      updateConfig('fields', newFields)
      setNewFieldName('')
      setNewFieldExpr('')
      setShowAddField(false)
    }
  }

  const removeCustomField = (fieldName) => {
    const newFields = { ...fields }
    delete newFields[fieldName]
    updateConfig('fields', newFields)
  }

  const customFields = Object.entries(fields).filter(([name, val]) => 
    !availableFields.includes(name) && val !== 0
  )

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-2">Include Fields</label>
        <div className="space-y-0.5 max-h-48 overflow-y-auto">
          {flatSchema.map((field, idx) => (
            <label 
              key={idx} 
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--bg-elevated)] cursor-pointer"
              style={{ paddingLeft: `${8 + field.depth * 12}px` }}
            >
              <input
                type="checkbox"
                checked={fields[field.fullPath] === 1}
                onChange={() => toggleField(field.fullPath)}
                className="w-4 h-4 rounded border-[var(--border)] text-violet-500"
              />
              <span className="text-sm text-[var(--text-primary)] flex-1">{field.displayName}</span>
              <span className={`text-[10px] ${getFieldTypeColor(field.type)}`}>
                {getFieldTypeLabel(field.type)}
              </span>
              {field.isNew && (
                <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-400">NEW</span>
              )}
            </label>
          ))}
        </div>
      </div>

      {customFields.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-2">Custom Fields</label>
          <div className="space-y-1">
            {customFields.map(([name, value]) => (
              <div key={name} className="flex items-center gap-2 p-2 rounded-lg bg-[var(--bg-elevated)]">
                <span className="text-sm text-[var(--text-primary)] flex-1">{name}</span>
                <span className="text-xs text-[var(--text-muted)]">{typeof value === 'string' ? value : JSON.stringify(value)}</span>
                <button onClick={() => removeCustomField(name)} className="p-1 text-red-400 hover:bg-red-500/20 rounded">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showAddField ? (
        <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] space-y-2">
          <input
            type="text"
            value={newFieldName}
            onChange={(e) => setNewFieldName(e.target.value)}
            placeholder="Field name"
            className="w-full h-8 px-2 rounded-md text-sm bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)]"
          />
          <input
            type="text"
            value={newFieldExpr}
            onChange={(e) => setNewFieldExpr(e.target.value)}
            placeholder="Value or $expression (optional)"
            className="w-full h-8 px-2 rounded-md text-sm bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)]"
          />
          <div className="flex gap-2">
            <button onClick={addCustomField} className="flex-1 h-8 rounded-md bg-violet-500 text-white text-sm">Add</button>
            <button onClick={() => setShowAddField(false)} className="flex-1 h-8 rounded-md bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-muted)] text-sm">Cancel</button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setShowAddField(true)} 
          className="w-full py-2 text-sm text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 rounded-lg transition-all flex items-center justify-center gap-2"
        >
          <Plus size={14} />
          Add Custom Field / Expression
        </button>
      )}
    </div>
  )
}

const SortConfig = ({ config, availableFields, updateConfig }) => {
  const fields = config.fields || []

  const addSortField = () => {
    updateConfig('fields', [...fields, { field: '', order: 1 }])
  }

  const updateSortField = (index, updates) => {
    const newFields = [...fields]
    newFields[index] = { ...newFields[index], ...updates }
    updateConfig('fields', newFields)
  }

  const removeSortField = (index) => {
    updateConfig('fields', fields.filter((_, i) => i !== index))
  }

  return (
    <div>
      <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-2">Sort Fields</label>
      {fields.map((f, index) => (
        <div key={index} className="flex gap-2 mb-2">
          <select
            value={f.field}
            onChange={(e) => updateSortField(index, { field: e.target.value })}
            className="flex-1 h-8 px-2 rounded-md text-sm bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)]"
          >
            <option value="">Select field</option>
            {availableFields.map(field => <option key={field} value={field}>{field}</option>)}
          </select>
          <select
            value={f.order}
            onChange={(e) => updateSortField(index, { order: parseInt(e.target.value) })}
            className="w-24 h-8 px-2 rounded-md text-sm bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)]"
          >
            <option value={1}>Asc</option>
            <option value={-1}>Desc</option>
          </select>
          <button onClick={() => removeSortField(index)} className="p-1 text-red-400 hover:bg-red-500/20 rounded">
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button onClick={addSortField} className="w-full py-2 text-sm text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 rounded-lg transition-all">
        + Add Sort Field
      </button>
    </div>
  )
}

const LimitConfig = ({ config, updateConfig }) => (
  <div>
    <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-2">Limit Count</label>
    <input
      type="number"
      value={config.count || 10}
      onChange={(e) => updateConfig('count', parseInt(e.target.value) || 0)}
      min={1}
      className="w-full h-9 px-3 rounded-lg text-sm bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)]"
    />
  </div>
)

const SkipConfig = ({ config, updateConfig }) => (
  <div>
    <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-2">Skip Count</label>
    <input
      type="number"
      value={config.count || 0}
      onChange={(e) => updateConfig('count', parseInt(e.target.value) || 0)}
      min={0}
      className="w-full h-9 px-3 rounded-lg text-sm bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)]"
    />
  </div>
)

const UnwindConfig = ({ config, availableFields, updateConfig }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-2">Array Path</label>
      <select
        value={config.path || ''}
        onChange={(e) => updateConfig('path', e.target.value)}
        className="w-full h-9 px-3 rounded-lg text-sm bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)]"
      >
        <option value="">Select array field</option>
        {availableFields.map(f => <option key={f} value={`$${f}`}>${f}</option>)}
      </select>
    </div>
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={config.preserveNullAndEmptyArrays || false}
        onChange={(e) => updateConfig('preserveNullAndEmptyArrays', e.target.checked)}
        className="w-4 h-4 rounded border-[var(--border)] text-violet-500"
      />
      <span className="text-sm text-[var(--text-primary)]">Preserve null and empty arrays</span>
    </label>
  </div>
)

const LookupConfig = ({ config, collections, availableFields, updateConfig }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-2">From Collection</label>
      <select
        value={config.from || ''}
        onChange={(e) => updateConfig('from', e.target.value)}
        className="w-full h-9 px-3 rounded-lg text-sm bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)]"
      >
        <option value="">Select collection</option>
        {collections.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
      </select>
    </div>
    <div>
      <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-2">Local Field</label>
      <select
        value={config.localField || ''}
        onChange={(e) => updateConfig('localField', e.target.value)}
        className="w-full h-9 px-3 rounded-lg text-sm bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)]"
      >
        <option value="">Select field</option>
        {availableFields.map(f => <option key={f} value={f}>{f}</option>)}
      </select>
    </div>
    <div>
      <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-2">Foreign Field</label>
      <input
        type="text"
        value={config.foreignField || ''}
        onChange={(e) => updateConfig('foreignField', e.target.value)}
        placeholder="e.g., _id"
        className="w-full h-9 px-3 rounded-lg text-sm bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)]"
      />
    </div>
    <div>
      <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-2">Output As</label>
      <input
        type="text"
        value={config.as || ''}
        onChange={(e) => updateConfig('as', e.target.value)}
        placeholder="e.g., joinedData"
        className="w-full h-9 px-3 rounded-lg text-sm bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)]"
      />
    </div>
  </div>
)

const AddFieldsConfig = ({ config, availableFields, schema, updateConfig }) => {
  const [newFieldName, setNewFieldName] = useState('')
  const [newFieldValue, setNewFieldValue] = useState('')
  const [showFieldPicker, setShowFieldPicker] = useState(false)
  const fields = config.fields || {}

  const addField = () => {
    if (newFieldName) {
      updateConfig('fields', { ...fields, [newFieldName]: newFieldValue })
      setNewFieldName('')
      setNewFieldValue('')
    }
  }

  const removeField = (name) => {
    const newFields = { ...fields }
    delete newFields[name]
    updateConfig('fields', newFields)
  }

  const insertFieldRef = (fieldName) => {
    setNewFieldValue((prev) => prev + `$${fieldName}`)
    setShowFieldPicker(false)
  }

  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">New Fields</label>
      
      {Object.entries(fields).map(([name, value]) => (
        <div key={name} className="flex items-center gap-2 p-2 rounded-lg bg-[var(--bg-elevated)]">
          <div className="flex-1">
            <p className="text-sm font-medium text-[var(--text-primary)]">{name}</p>
            <p className="text-xs text-[var(--text-muted)] truncate">{typeof value === 'string' ? value : JSON.stringify(value)}</p>
          </div>
          <button onClick={() => removeField(name)} className="p-1 text-red-400 hover:bg-red-500/20 rounded">
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] space-y-2">
        <input
          type="text"
          value={newFieldName}
          onChange={(e) => setNewFieldName(e.target.value)}
          placeholder="New field name"
          className="w-full h-8 px-2 rounded-md text-sm bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)]"
        />
        <div className="relative">
          <input
            type="text"
            value={newFieldValue}
            onChange={(e) => setNewFieldValue(e.target.value)}
            placeholder="Value or $expression"
            className="w-full h-8 px-2 rounded-md text-sm bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)]"
          />
          <button 
            onClick={() => setShowFieldPicker(!showFieldPicker)}
            className="absolute right-1 top-1 h-6 px-2 text-xs bg-[var(--bg-hover)] rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            $ Insert Field
          </button>
          {showFieldPicker && (
            <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg shadow-xl z-10 max-h-32 overflow-y-auto">
              {availableFields.map(f => (
                <button
                  key={f}
                  onClick={() => insertFieldRef(f)}
                  className="w-full text-left px-2 py-1 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded"
                >
                  ${f}
                </button>
              ))}
            </div>
          )}
        </div>
        <button 
          onClick={addField} 
          disabled={!newFieldName}
          className="w-full h-8 rounded-md bg-violet-500 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add Field
        </button>
      </div>
    </div>
  )
}

const CountConfig = ({ config, updateConfig }) => (
  <div>
    <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-2">Count Field Name</label>
    <input
      type="text"
      value={config.fieldName || 'count'}
      onChange={(e) => updateConfig('fieldName', e.target.value)}
      className="w-full h-9 px-3 rounded-lg text-sm bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)]"
    />
  </div>
)

const stageConfigToMongo = (type, config) => {
  switch (type) {
    case '$match': {
      const matchObj = {}
      ;(config.conditions || []).forEach(cond => {
        if (cond.field && cond.operator) {
          if (cond.operator === '$eq') {
            matchObj[cond.field] = cond.value
          } else {
            matchObj[cond.field] = { [cond.operator]: cond.value }
          }
        }
      })
      return matchObj
    }
    case '$group': {
      const groupObj = { _id: config._id === 'null' ? null : config._id }
      ;(config.accumulators || []).forEach(acc => {
        if (acc.field) {
          groupObj[acc.field] = { [acc.accumulator]: acc.sourceField }
        }
      })
      return groupObj
    }
    case '$project':
      return config.fields || {}
    case '$sort': {
      const sortObj = {}
      ;(config.fields || []).forEach(f => {
        if (f.field) sortObj[f.field] = f.order
      })
      return sortObj
    }
    case '$limit':
      return config.count || 10
    case '$skip':
      return config.count || 0
    case '$unwind':
      return config.preserveNullAndEmptyArrays
        ? { path: config.path, preserveNullAndEmptyArrays: true }
        : config.path
    case '$lookup':
      return {
        from: config.from,
        localField: config.localField,
        foreignField: config.foreignField,
        as: config.as
      }
    case '$addFields':
      return config.fields || {}
    case '$count':
      return config.fieldName || 'count'
    default:
      return {}
  }
}

export default AggregationBuilder
