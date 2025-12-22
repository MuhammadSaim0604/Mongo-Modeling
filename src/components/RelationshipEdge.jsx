import React from 'react'
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from '@xyflow/react'
import { X } from 'lucide-react'
import useStore from '../stores/useStore'

const RelationshipEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected
}) => {
  const { updateRelationship, deleteRelationship } = useStore()

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 20
  })

  const relationshipTypes = ['one-to-one', 'one-to-many', 'many-to-many']
  const typeSymbols = {
    'one-to-one': '1:1',
    'one-to-many': '1:N',
    'many-to-many': 'N:M'
  }

  const cycleType = () => {
    const currentIndex = relationshipTypes.indexOf(data?.relationshipType || 'one-to-many')
    const nextIndex = (currentIndex + 1) % relationshipTypes.length
    updateRelationship(id, { relationshipType: relationshipTypes[nextIndex] })
  }

  return (
    <>
      <defs>
        <linearGradient id={`edge-gradient-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? '#a855f7' : `url(#edge-gradient-${id})`,
          strokeWidth: selected ? 3 : 2,
          filter: selected ? 'drop-shadow(0 0 6px rgba(168, 85, 247, 0.5))' : 'none'
        }}
      />
      <EdgeLabelRenderer>
        <div
          className="absolute flex items-center gap-1 pointer-events-auto"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`
          }}
        >
          <button
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all duration-200 ${
              selected
                ? 'bg-[var(--accent-primary)] text-white shadow-lg shadow-[var(--accent-primary)]/30'
                : 'bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--accent-primary)] hover:bg-[var(--bg-hover)] hover:border-[var(--border-hover)]'
            }`}
            onClick={cycleType}
          >
            {typeSymbols[data?.relationshipType || 'one-to-many']}
          </button>
          {selected && (
            <button
              className="w-6 h-6 bg-red-500 hover:bg-red-400 text-white rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 shadow-lg shadow-red-500/30 hover:scale-110"
              onClick={() => deleteRelationship(id)}
            >
              <X size={12} />
            </button>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

export default RelationshipEdge
