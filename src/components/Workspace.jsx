import React, { useCallback, useEffect } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useReactFlow
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import useStore from '../stores/useStore'
import CollectionNode from './CollectionNode'
import RelationshipEdge from './RelationshipEdge'
import { autoSave, loadAutoSave } from '../utils/storage'
import { Database, Plus, Sparkles } from 'lucide-react'

const nodeTypes = {
  collection: CollectionNode
}

const edgeTypes = {
  relationship: RelationshipEdge
}

const Workspace = () => {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    addRelationship,
    loadProjectData,
    getProjectData,
    addCollection
  } = useStore()

  const { fitView } = useReactFlow()

  useEffect(() => {
    const savedData = loadAutoSave()
    if (savedData && savedData.nodes && savedData.nodes.length > 0) {
      loadProjectData(savedData)
      setTimeout(() => fitView({ padding: 0.2 }), 100)
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      const data = getProjectData()
      if (data.nodes.length > 0) {
        autoSave(data)
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [getProjectData])

  const onConnect = useCallback((connection) => {
    addRelationship(connection)
  }, [addRelationship])

  const defaultEdgeOptions = {
    type: 'relationship',
    animated: true
  }

  const handleAddCollection = () => {
    const offset = nodes.length * 40
    const viewportCenter = { x: 100 + offset, y: 80 + (nodes.length % 3) * 150 }
    addCollection(viewportCenter)
  }

  return (
    <div className="h-full w-full bg-[var(--bg-base)] relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        defaultViewport={{ x: 50, y: 50, zoom: 1 }}
        snapToGrid
        snapGrid={[16, 16]}
        minZoom={0.2}
        maxZoom={2}
        deleteKeyCode={['Backspace', 'Delete']}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          id="grid-small"
          color="rgba(255, 255, 255, 0.08)"
          gap={24}
          size={1}
          variant="cross"
        />
        <Background
          id="grid-large"
          color="rgba(139, 92, 246, 0.15)"
          gap={120}
          size={2}
          variant="cross"
        />
        <Controls
          showInteractive={false}
          position="bottom-left"
        />
        <MiniMap
          nodeColor="var(--accent-primary)"
          maskColor="rgba(0, 0, 0, 0.7)"
          position="bottom-right"
          pannable
          zoomable
        />
      </ReactFlow>

      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center max-w-md px-8">
            <div className="relative mx-auto mb-8 w-24 h-24">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-purple-600/10 rounded-3xl" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Database size={40} className="text-[var(--accent-primary)]" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-[var(--accent-primary)] rounded-lg flex items-center justify-center">
                <Sparkles size={12} className="text-white" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
              Start Building Your Schema
            </h2>
            <p className="text-[var(--text-muted)] leading-relaxed mb-8">
              Create collections, define fields with types and validations, then connect them to build relationships.
            </p>

            <button
              onClick={handleAddCollection}
              className="pointer-events-auto inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/25 transition-all"
            >
              <Plus size={18} />
              Add Your First Collection
            </button>
          </div>
        </div>
      )}

      {nodes.length > 0 && (
        <button
          onClick={handleAddCollection}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium shadow-xl text-white bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/25 transition-all"
        >
          <Plus size={16} />
          Add Collection
        </button>
      )}
    </div>
  )
}

export default Workspace
