import React, { useState, useEffect } from 'react'
import { X, Plus, Trash2, AlertCircle, Settings2, Shield, Sparkles } from 'lucide-react'
import useStore from '../stores/useStore'

const FieldEditor = () => {
  const {
    nodes,
    selectedNode,
    selectedField,
    updateField,
    setShowFieldEditor,
    MONGO_TYPES
  } = useStore()

  const node = nodes.find(n => n.id === selectedNode)
  const field = node?.data.fields.find(f => f.id === selectedField)

  const [localField, setLocalField] = useState(null)
  const [enumInput, setEnumInput] = useState('')
  const [activeTab, setActiveTab] = useState('properties')

  useEffect(() => {
    if (field) {
      setLocalField({ ...field })
    }
  }, [field])

  if (!localField || !node) {
    return null
  }

  const handleChange = (key, value) => {
    setLocalField(prev => ({ ...prev, [key]: value }))
  }

  const handleValidationChange = (key, value) => {
    setLocalField(prev => ({
      ...prev,
      validation: { ...prev.validation, [key]: value }
    }))
  }

  const handleAddEnum = () => {
    if (enumInput.trim()) {
      const newEnums = [...(localField.enum || []), enumInput.trim()]
      handleChange('enum', newEnums)
      setEnumInput('')
    }
  }

  const handleRemoveEnum = (index) => {
    const newEnums = localField.enum.filter((_, i) => i !== index)
    handleChange('enum', newEnums)
  }

  const handleSave = () => {
    updateField(selectedNode, selectedField, localField)
    setShowFieldEditor(false)
  }

  const handleClose = () => {
    setShowFieldEditor(false)
  }

  const otherCollections = nodes.filter(n => n.id !== selectedNode)

  const tabs = [
    { id: 'properties', label: 'Properties', icon: Settings2 },
    { id: 'validation', label: 'Validation', icon: Shield },
    { id: 'advanced', label: 'Advanced', icon: Sparkles }
  ]

  const ToggleSwitch = ({ checked, onChange }) => (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-[22px] rounded-full transition-all ${
        checked ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-hover)]'
      }`}
    >
      <span
        className={`absolute top-[2px] left-[2px] w-[18px] h-[18px] bg-white rounded-full transition-transform ${
          checked ? 'translate-x-[18px]' : ''
        }`}
      />
    </button>
  )

  const showValidationContent = localField.type === 'String' || 
    localField.type === 'Number' || 
    localField.type === 'Decimal128' ||
    localField.type === 'Date'

  return (
    <div className="fixed inset-0 z-[1000] flex justify-end" onClick={handleClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      <div
        className="relative w-full max-w-md h-full bg-[var(--bg-surface)] border-l border-[var(--border)] flex flex-col animate-slide-right"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)]">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Edit Field</h2>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">
              {node.data.name}.{localField.name}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex border-b border-[var(--border)]">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                activeTab === tab.id 
                  ? 'text-[var(--text-primary)] border-[var(--accent-primary)]' 
                  : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-secondary)]'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'properties' && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Field Name
                </label>
                <input
                  type="text"
                  value={localField.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="fieldName"
                  className="w-full h-11 px-4 rounded-xl text-sm bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Data Type
                </label>
                <select
                  value={localField.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  className="w-full h-11 px-4 rounded-xl text-sm cursor-pointer appearance-none bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2371717a' viewBox='0 0 16 16'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center'
                  }}
                >
                  {MONGO_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {localField.type === 'ObjectId' && (
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Reference Collection
                  </label>
                  <select
                    value={localField.ref || ''}
                    onChange={(e) => handleChange('ref', e.target.value || null)}
                    className="w-full h-11 px-4 rounded-xl text-sm cursor-pointer appearance-none bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2371717a' viewBox='0 0 16 16'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center'
                    }}
                  >
                    <option value="">None</option>
                    {otherCollections.map(col => (
                      <option key={col.id} value={col.id}>
                        {col.data.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">Required</p>
                    <p className="text-xs text-[var(--text-muted)]">Field must have a value</p>
                  </div>
                  <ToggleSwitch
                    checked={localField.required}
                    onChange={(val) => handleChange('required', val)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">Unique</p>
                    <p className="text-xs text-[var(--text-muted)]">No duplicate values allowed</p>
                  </div>
                  <ToggleSwitch
                    checked={localField.unique}
                    onChange={(val) => handleChange('unique', val)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">Index</p>
                    <p className="text-xs text-[var(--text-muted)]">Create index for faster queries</p>
                  </div>
                  <ToggleSwitch
                    checked={localField.index}
                    onChange={(val) => handleChange('index', val)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Default Value
                </label>
                <input
                  type="text"
                  value={localField.default || ''}
                  onChange={(e) => handleChange('default', e.target.value)}
                  placeholder={localField.type === 'Date' ? 'now' : 'Enter default value'}
                  className="w-full h-11 px-4 rounded-xl text-sm bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
                />
              </div>
            </div>
          )}

          {activeTab === 'validation' && (
            <div className="space-y-5">
              {(localField.type === 'Number' || localField.type === 'Decimal128') && (
                <>
                  <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
                    <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">Number Constraints</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[var(--text-muted)] mb-2">
                          Minimum Value
                        </label>
                        <input
                          type="number"
                          value={localField.validation?.min || ''}
                          onChange={(e) => handleValidationChange('min', e.target.value)}
                          placeholder="No limit"
                          className="w-full h-10 px-3 rounded-lg text-sm bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--text-muted)] mb-2">
                          Maximum Value
                        </label>
                        <input
                          type="number"
                          value={localField.validation?.max || ''}
                          onChange={(e) => handleValidationChange('max', e.target.value)}
                          placeholder="No limit"
                          className="w-full h-10 px-3 rounded-lg text-sm bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {localField.type === 'String' && (
                <>
                  <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
                    <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">Length Constraints</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[var(--text-muted)] mb-2">
                          Min Length
                        </label>
                        <input
                          type="number"
                          value={localField.validation?.minLength || ''}
                          onChange={(e) => handleValidationChange('minLength', e.target.value)}
                          placeholder="No limit"
                          className="w-full h-10 px-3 rounded-lg text-sm bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--text-muted)] mb-2">
                          Max Length
                        </label>
                        <input
                          type="number"
                          value={localField.validation?.maxLength || ''}
                          onChange={(e) => handleValidationChange('maxLength', e.target.value)}
                          placeholder="No limit"
                          className="w-full h-10 px-3 rounded-lg text-sm bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
                    <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">Pattern Matching</h4>
                    <div>
                      <label className="block text-xs font-medium text-[var(--text-muted)] mb-2">
                        Regex Pattern
                      </label>
                      <input
                        type="text"
                        value={localField.validation?.match || ''}
                        onChange={(e) => handleValidationChange('match', e.target.value)}
                        placeholder="^[a-zA-Z0-9]+$"
                        className="w-full h-10 px-3 rounded-lg text-sm font-mono bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
                      />
                      <p className="text-[10px] text-[var(--text-muted)] mt-2">
                        Values must match this regular expression
                      </p>
                    </div>
                  </div>
                </>
              )}

              {localField.type === 'Date' && (
                <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
                  <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">Date Constraints</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[var(--text-muted)] mb-2">
                        Min Date
                      </label>
                      <input
                        type="text"
                        value={localField.validation?.min || ''}
                        onChange={(e) => handleValidationChange('min', e.target.value)}
                        placeholder="YYYY-MM-DD"
                        className="w-full h-10 px-3 rounded-lg text-sm bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--text-muted)] mb-2">
                        Max Date
                      </label>
                      <input
                        type="text"
                        value={localField.validation?.max || ''}
                        onChange={(e) => handleValidationChange('max', e.target.value)}
                        placeholder="YYYY-MM-DD"
                        className="w-full h-10 px-3 rounded-lg text-sm bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {!showValidationContent && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-xl bg-[var(--bg-elevated)] flex items-center justify-center mx-auto mb-3">
                    <AlertCircle size={20} className="text-[var(--text-muted)]" />
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">No validation rules available</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {localField.type} type doesn't have specific validation options
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
                <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">Enum Values</h4>
                <p className="text-xs text-[var(--text-muted)] mb-3">
                  Restrict field to specific allowed values
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={enumInput}
                    onChange={(e) => setEnumInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddEnum()}
                    placeholder="Add allowed value"
                    className="flex-1 h-10 px-3 rounded-lg text-sm bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
                  />
                  <button
                    onClick={handleAddEnum}
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 transition-all"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {localField.enum && localField.enum.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {localField.enum.map((value, index) => (
                      <span
                        key={index}
                        className="flex items-center gap-2 bg-[var(--bg-surface)] border border-[var(--border)] px-3 py-1.5 rounded-lg text-sm"
                      >
                        {value}
                        <button
                          onClick={() => handleRemoveEnum(index)}
                          className="text-[var(--text-muted)] hover:text-red-400 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
                <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">Field Information</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Field ID</span>
                    <span className="text-[var(--text-secondary)] font-mono">{localField.id.slice(0, 8)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Collection</span>
                    <span className="text-[var(--text-secondary)]">{node.data.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Type</span>
                    <span className="text-[var(--accent-primary)]">{localField.type}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-5 border-t border-[var(--border)]">
          <button
            onClick={handleClose}
            className="flex-1 h-11 rounded-xl text-sm font-medium bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 h-11 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/25 transition-all"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

export default FieldEditor
