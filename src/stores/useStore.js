import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

const MONGO_TYPES = [
  'String', 'Number', 'Boolean', 'Date', 'ObjectId', 'Array', 'Object',
  'Buffer', 'Mixed', 'Decimal128', 'Map'
]

const createDefaultField = () => ({
  id: uuidv4(),
  name: 'newField',
  type: 'String',
  required: false,
  unique: false,
  index: false,
  default: '',
  enum: [],
  ref: null,
  validation: {
    min: null,
    max: null,
    minLength: null,
    maxLength: null,
    match: null
  }
})

const createDefaultCollection = (position) => ({
  id: uuidv4(),
  name: 'NewCollection',
  fields: [
    {
      id: uuidv4(),
      name: '_id',
      type: 'ObjectId',
      required: true,
      unique: true,
      index: true,
      default: '',
      enum: [],
      ref: null,
      validation: {}
    }
  ],
  timestamps: true,
  position
})

const createDefaultAggregation = (sourceCollection = null) => ({
  id: uuidv4(),
  name: 'New Aggregation',
  sourceCollection,
  stages: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
})

const useStore = create((set, get) => ({
  projectId: null,
  nodes: [],
  edges: [],
  selectedNode: null,
  selectedField: null,
  projectName: 'Untitled Database',
  showCodePanel: false,
  showFieldEditor: false,
  
  // Aggregation state
  aggregations: [],
  showAggregationBuilder: false,
  currentAggregation: null,
  editingAggregationId: null,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  
  onNodesChange: (changes) => {
    set((state) => {
      const updatedNodes = [...state.nodes]
      changes.forEach((change) => {
        if (change.type === 'position' && change.position) {
          const nodeIndex = updatedNodes.findIndex((n) => n.id === change.id)
          if (nodeIndex !== -1) {
            updatedNodes[nodeIndex] = {
              ...updatedNodes[nodeIndex],
              position: change.position
            }
          }
        }
        if (change.type === 'remove') {
          const idx = updatedNodes.findIndex((n) => n.id === change.id)
          if (idx !== -1) updatedNodes.splice(idx, 1)
        }
        if (change.type === 'select') {
          const nodeIndex = updatedNodes.findIndex((n) => n.id === change.id)
          if (nodeIndex !== -1) {
            updatedNodes[nodeIndex] = {
              ...updatedNodes[nodeIndex],
              selected: change.selected
            }
          }
        }
      })
      return { nodes: updatedNodes }
    })
  },

  onEdgesChange: (changes) => {
    set((state) => {
      let updatedEdges = [...state.edges]
      changes.forEach((change) => {
        if (change.type === 'remove') {
          updatedEdges = updatedEdges.filter((e) => e.id !== change.id)
        }
        if (change.type === 'select') {
          const edgeIndex = updatedEdges.findIndex((e) => e.id === change.id)
          if (edgeIndex !== -1) {
            updatedEdges[edgeIndex] = {
              ...updatedEdges[edgeIndex],
              selected: change.selected
            }
          }
        }
      })
      return { edges: updatedEdges }
    })
  },

  addCollection: (position = { x: 100, y: 100 }) => {
    const collection = createDefaultCollection(position)
    const newNode = {
      id: collection.id,
      type: 'collection',
      position: collection.position,
      data: collection
    }
    set((state) => ({
      nodes: [...state.nodes, newNode]
    }))
    return collection.id
  },

  updateCollection: (id, updates) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, ...updates } }
          : node
      )
    }))
  },

  deleteCollection: (id) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      edges: state.edges.filter(
        (edge) => edge.source !== id && edge.target !== id
      )
    }))
  },

  addField: (collectionId) => {
    const newField = createDefaultField()
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === collectionId
          ? {
              ...node,
              data: {
                ...node.data,
                fields: [...node.data.fields, newField]
              }
            }
          : node
      )
    }))
    return newField.id
  },

  updateField: (collectionId, fieldId, updates) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === collectionId
          ? {
              ...node,
              data: {
                ...node.data,
                fields: node.data.fields.map((field) =>
                  field.id === fieldId ? { ...field, ...updates } : field
                )
              }
            }
          : node
      )
    }))
  },

  deleteField: (collectionId, fieldId) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === collectionId
          ? {
              ...node,
              data: {
                ...node.data,
                fields: node.data.fields.filter((f) => f.id !== fieldId)
              }
            }
          : node
      ),
      edges: state.edges.filter(
        (edge) =>
          !(edge.sourceHandle === fieldId || edge.targetHandle === fieldId)
      )
    }))
  },

  addRelationship: (connection) => {
    const { source, sourceHandle, target, targetHandle } = connection
    const existingEdge = get().edges.find(
      (e) =>
        e.source === source &&
        e.sourceHandle === sourceHandle &&
        e.target === target &&
        e.targetHandle === targetHandle
    )
    if (existingEdge) return

    const newEdge = {
      id: `${source}-${sourceHandle}-${target}-${targetHandle}`,
      source,
      sourceHandle,
      target,
      targetHandle,
      type: 'relationship',
      data: {
        relationshipType: 'one-to-many',
        sourceFieldId: sourceHandle,
        targetFieldId: targetHandle
      }
    }

    set((state) => ({ edges: [...state.edges, newEdge] }))
  },

  updateRelationship: (edgeId, updates) => {
    set((state) => ({
      edges: state.edges.map((edge) =>
        edge.id === edgeId
          ? { ...edge, data: { ...edge.data, ...updates } }
          : edge
      )
    }))
  },

  deleteRelationship: (edgeId) => {
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== edgeId)
    }))
  },

  setSelectedNode: (nodeId) => set({ selectedNode: nodeId }),
  setSelectedField: (fieldId) => set({ selectedField: fieldId }),
  setProjectName: (name) => set({ projectName: name }),
  setProjectId: (id) => set({ projectId: id }),
  toggleCodePanel: () => set((state) => ({ showCodePanel: !state.showCodePanel })),
  setShowCodePanel: (show) => set({ showCodePanel: show }),
  toggleFieldEditor: () => set((state) => ({ showFieldEditor: !state.showFieldEditor })),
  setShowFieldEditor: (show) => set({ showFieldEditor: show }),

  getProjectData: () => {
    const state = get()
    return {
      id: state.projectId,
      projectName: state.projectName,
      nodes: state.nodes,
      edges: state.edges,
      aggregations: state.aggregations,
      version: '1.0.0',
      exportedAt: new Date().toISOString()
    }
  },

  loadProjectData: (data) => {
    set({
      projectId: data.id || null,
      projectName: data.projectName || 'Untitled Database',
      nodes: data.nodes || [],
      edges: data.edges || [],
      aggregations: data.aggregations || []
    })
  },

  clearProject: () => {
    const newProjectId = uuidv4()
    set({
      projectId: newProjectId,
      nodes: [],
      edges: [],
      aggregations: [],
      selectedNode: null,
      selectedField: null,
      projectName: 'Untitled Database',
      showAggregationBuilder: false,
      currentAggregation: null,
      editingAggregationId: null
    })
    return newProjectId
  },

  // Aggregation functions
  openAggregationBuilder: (sourceCollection = null) => {
    const newAgg = createDefaultAggregation(sourceCollection)
    set({
      showAggregationBuilder: true,
      currentAggregation: newAgg,
      editingAggregationId: null
    })
  },

  closeAggregationBuilder: () => {
    set({
      showAggregationBuilder: false,
      currentAggregation: null,
      editingAggregationId: null
    })
  },

  setCurrentAggregation: (aggregation) => set({ currentAggregation: aggregation }),

  saveAggregation: () => {
    const state = get()
    const agg = state.currentAggregation
    if (!agg) return

    const updatedAgg = { ...agg, updatedAt: new Date().toISOString() }
    
    if (state.editingAggregationId) {
      set({
        aggregations: state.aggregations.map(a => 
          a.id === state.editingAggregationId ? updatedAgg : a
        ),
        currentAggregation: updatedAgg
      })
    } else {
      set({
        aggregations: [...state.aggregations, updatedAgg],
        editingAggregationId: updatedAgg.id,
        currentAggregation: updatedAgg
      })
    }
  },

  loadAggregation: (aggId) => {
    const state = get()
    const agg = state.aggregations.find(a => a.id === aggId)
    if (agg) {
      set({
        showAggregationBuilder: true,
        currentAggregation: { ...agg },
        editingAggregationId: agg.id
      })
    }
  },

  deleteAggregation: (aggId) => {
    set((state) => ({
      aggregations: state.aggregations.filter(a => a.id !== aggId),
      currentAggregation: state.currentAggregation?.id === aggId ? null : state.currentAggregation,
      editingAggregationId: state.editingAggregationId === aggId ? null : state.editingAggregationId,
      showAggregationBuilder: state.currentAggregation?.id === aggId ? false : state.showAggregationBuilder
    }))
  },

  duplicateAggregation: (aggId) => {
    const state = get()
    const original = state.aggregations.find(a => a.id === aggId)
    if (original) {
      const duplicate = {
        ...original,
        id: uuidv4(),
        name: `${original.name} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      set({
        aggregations: [...state.aggregations, duplicate]
      })
    }
  },

  updateAggregationStages: (stages) => {
    set((state) => ({
      currentAggregation: state.currentAggregation 
        ? { ...state.currentAggregation, stages, updatedAt: new Date().toISOString() }
        : null
    }))
  },

  addStage: (stageType) => {
    const state = get()
    if (!state.currentAggregation) return

    const newStage = {
      id: uuidv4(),
      type: stageType,
      enabled: true,
      config: getDefaultStageConfig(stageType)
    }

    set({
      currentAggregation: {
        ...state.currentAggregation,
        stages: [...state.currentAggregation.stages, newStage],
        updatedAt: new Date().toISOString()
      }
    })
  },

  updateStage: (stageId, updates) => {
    set((state) => ({
      currentAggregation: state.currentAggregation
        ? {
            ...state.currentAggregation,
            stages: state.currentAggregation.stages.map(s =>
              s.id === stageId ? { ...s, ...updates } : s
            ),
            updatedAt: new Date().toISOString()
          }
        : null
    }))
  },

  deleteStage: (stageId) => {
    set((state) => ({
      currentAggregation: state.currentAggregation
        ? {
            ...state.currentAggregation,
            stages: state.currentAggregation.stages.filter(s => s.id !== stageId),
            updatedAt: new Date().toISOString()
          }
        : null
    }))
  },

  reorderStages: (fromIndex, toIndex) => {
    set((state) => {
      if (!state.currentAggregation) return state
      const stages = [...state.currentAggregation.stages]
      const [removed] = stages.splice(fromIndex, 1)
      stages.splice(toIndex, 0, removed)
      return {
        currentAggregation: {
          ...state.currentAggregation,
          stages,
          updatedAt: new Date().toISOString()
        }
      }
    })
  },

  MONGO_TYPES
}))

const getDefaultStageConfig = (stageType) => {
  switch (stageType) {
    case '$match':
      return { conditions: [] }
    case '$group':
      return { _id: '', accumulators: [] }
    case '$project':
      return { fields: {} }
    case '$sort':
      return { fields: [] }
    case '$limit':
      return { count: 10 }
    case '$skip':
      return { count: 0 }
    case '$unwind':
      return { path: '', preserveNullAndEmptyArrays: false }
    case '$lookup':
      return { from: '', localField: '', foreignField: '', as: '' }
    case '$addFields':
      return { fields: {} }
    case '$count':
      return { fieldName: 'count' }
    case '$sample':
      return { size: 10 }
    default:
      return {}
  }
}

export default useStore
