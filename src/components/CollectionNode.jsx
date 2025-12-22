import React, { useState, useCallback } from "react";
import { Handle, Position } from "@xyflow/react";
import {
  Database,
  Plus,
  Trash2,
  Edit2,
  Key,
  Hash,
  Calendar,
  Type,
  ToggleLeft,
  List,
  Box,
  ChevronDown,
  ChevronUp,
  Link2,
  Grip,
} from "lucide-react";
import useStore from "../stores/useStore";

const typeIcons = {
  String: Type,
  Number: Hash,
  Boolean: ToggleLeft,
  Date: Calendar,
  ObjectId: Key,
  Array: List,
  Object: Box,
  Buffer: Box,
  Mixed: Box,
  Decimal128: Hash,
  Map: Box,
};

const typeColors = {
  String: "text-emerald-400",
  Number: "text-blue-400",
  Boolean: "text-amber-400",
  Date: "text-pink-400",
  ObjectId: "text-violet-400",
  Array: "text-cyan-400",
  Object: "text-orange-400",
  Buffer: "text-gray-400",
  Mixed: "text-gray-400",
  Decimal128: "text-blue-400",
  Map: "text-teal-400",
};

const CollectionNode = ({ id, data, selected }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(data.name);

  const {
    updateCollection,
    deleteCollection,
    addField,
    deleteField,
    setSelectedNode,
    setSelectedField,
    setShowFieldEditor,
  } = useStore();

  const handleNameSubmit = useCallback(() => {
    if (newName.trim()) {
      updateCollection(id, { name: newName.trim() });
    }
    setEditingName(false);
  }, [id, newName, updateCollection]);

  const handleAddField = useCallback(
    (e) => {
      e.stopPropagation();
      const fieldId = addField(id);
      setSelectedNode(id);
      setSelectedField(fieldId);
      setShowFieldEditor(true);
    },
    [id, addField, setSelectedNode, setSelectedField, setShowFieldEditor],
  );

  const handleEditField = useCallback(
    (fieldId, e) => {
      e.stopPropagation();
      setSelectedNode(id);
      setSelectedField(fieldId);
      setShowFieldEditor(true);
    },
    [id, setSelectedNode, setSelectedField, setShowFieldEditor],
  );

  const handleDeleteField = useCallback(
    (fieldId, e) => {
      e.stopPropagation();
      if (fieldId !== data.fields[0]?.id) {
        deleteField(id, fieldId);
      }
    },
    [id, data.fields, deleteField],
  );

  return (
    <div
      className={`min-w-[240px] max-w-[300px] rounded-2xl transition-all duration-200 ${
        selected
          ? "ring-2 ring-[var(--accent-primary)] shadow-lg shadow-[var(--accent-primary)]/20"
          : "ring-1 ring-[var(--border)] hover:ring-[var(--border-hover)]"
      }`}
      style={{ background: "var(--bg-surface)" }}
    >
      <Handle
        type="target"
        position={Position.Left}
        id={`${id}-collection-target`}
        className="!w-4 !h-4 !bg-[var(--accent-primary)] !border-2 !border-[var(--bg-surface)] !-left-2 !top-8"
        style={{ borderRadius: "4px" }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id={`${id}-collection-source`}
        className="!w-4 !h-4 !bg-[var(--accent-primary)] !border-2 !border-[var(--bg-surface)] !-right-2 !top-8"
        style={{ borderRadius: "4px" }}
      />

      <div className="relative overflow-hidden rounded-t-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />

        <div className="relative flex items-center gap-3 px-4 py-3.5">
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center cursor-grab">
            <Database size={16} className="text-white" />
          </div>

          {editingName ? (
            <input
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm font-semibold focus:outline-none focus:border-white/40"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className="flex-1 font-semibold text-white cursor-text truncate"
              onDoubleClick={() => setEditingName(true)}
              title="Double-click to rename"
            >
              {data.name}
            </span>
          )}

          {!editingName && (
            <div className="flex items-center gap-1">
              <button
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? (
                  <ChevronUp size={14} />
                ) : (
                  <ChevronDown size={14} />
                )}
              </button>
              <button
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-red-500/80 flex items-center justify-center text-white/80 hover:text-white transition-all"
                onClick={() => deleteCollection(id)}
                title="Delete collection"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="p-3 space-y-1.5">
          {data.fields.map((field, index) => {
            const TypeIcon = typeIcons[field.type] || Type;
            const typeColor = typeColors[field.type] || "text-gray-400";
            const isIdField = field.name === "_id";

            return (
              <div key={field.id} className="group relative">
                {/* Handles positioned outside the overflow-hidden container */}
                <Handle
                  type="target"
                  position={Position.Left}
                  id={`${field.id}-target`}
                  className="!w-2.5 !h-2.5 !bg-emerald-500 !border-2 !border-[var(--bg-surface)] !-left-[6px] hover:!scale-150 !opacity-0 group-hover:!opacity-100 !transition-all !duration-200 !z-10 !rounded-full"
                  style={{ top: "50%", transform: "translateY(-50%)" }}
                />
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`${field.id}-source`}
                  className="!w-2.5 !h-2.5 !bg-rose-500 !border-2 !border-[var(--bg-surface)] !-right-[6px] hover:!scale-150 !opacity-0 group-hover:!opacity-100 !transition-all !duration-200 !z-10 !rounded-full"
                  style={{ top: "50%", transform: "translateY(-50%)" }}
                />

                {/* Inner container with overflow-hidden for action buttons */}
                <div
                  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all overflow-hidden ${
                    isIdField
                      ? "bg-[var(--bg-elevated)] border border-dashed border-[var(--border)]"
                      : "bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] cursor-pointer"
                  }`}
                  onClick={(e) => !isIdField && handleEditField(field.id, e)}
                >
                  <div
                    className={`w-6 h-6 rounded-md bg-[var(--bg-surface)] flex items-center justify-center flex-shrink-0 ${typeColor}`}
                  >
                    <TypeIcon size={12} />
                  </div>

                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <span
                      className="font-medium text-sm text-[var(--text-primary)] truncate"
                      title={field.name}
                    >
                      {field.name}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-surface)] flex-shrink-0 ${typeColor}`}
                    >
                      {field.type}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {field.required && (
                      <span
                        className="text-[8px] px-1 py-0.5 rounded bg-red-500/15 text-red-400 font-semibold"
                        title="Required"
                      >
                        R
                      </span>
                    )}
                    {field.unique && (
                      <span
                        className="text-[8px] px-1 py-0.5 rounded bg-purple-500/15 text-purple-400 font-semibold"
                        title="Unique"
                      >
                        U
                      </span>
                    )}
                    {field.index && (
                      <span
                        className="text-[8px] px-1 py-0.5 rounded bg-blue-500/15 text-blue-400 font-semibold"
                        title="Indexed"
                      >
                        I
                      </span>
                    )}
                    {field.ref && (
                      <span
                        className="text-[8px] px-1 py-0.5 rounded bg-amber-500/15 text-amber-400 font-semibold flex items-center gap-0.5"
                        title="Reference"
                      >
                        <Link2 size={8} />
                      </span>
                    )}
                  </div>

                  {!isIdField && (
                    <div className="absolute right-0 top-0 bottom-0 flex items-center translate-x-full group-hover:translate-x-0 opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out">
                      <div className="w-0 h-0 border-t-[20px] border-t-transparent border-b-[20px] border-b-transparent border-r-[10px] border-r-violet-500/80" />
                      <div className="flex items-center gap-0.5 h-full px-2 bg-violet-500/80">
                        <button
                          className="w-6 h-6 rounded-md flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditField(field.id, e);
                          }}
                          title="Edit field"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          className="w-6 h-6 rounded-md flex items-center justify-center text-white/80 hover:text-white hover:bg-red-500/50 transition-all"
                          onClick={(e) => handleDeleteField(field.id, e)}
                          title="Delete field"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <button
            className="w-full flex items-center justify-center gap-2 py-2.5 mt-2 border border-dashed border-[var(--border)] rounded-xl text-sm text-[var(--text-muted)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5 transition-all"
            onClick={handleAddField}
          >
            <Plus size={14} />
            Add Field
          </button>
        </div>
      )}

      {data.timestamps && (
        <div className="px-4 py-2.5 border-t border-[var(--border)]">
          <span className="text-[10px] px-2 py-1 rounded-md bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-medium">
            timestamps: true
          </span>
        </div>
      )}
    </div>
  );
};

export default CollectionNode;
