export const FieldType = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  DATE: 'date',
  OBJECT_ID: 'objectId',
  ARRAY: 'array',
  OBJECT: 'object',
  MIXED: 'mixed',
  UNKNOWN: 'unknown'
}

const mongoTypeToFieldType = (mongoType) => {
  const typeMap = {
    'String': FieldType.STRING,
    'Number': FieldType.NUMBER,
    'Boolean': FieldType.BOOLEAN,
    'Date': FieldType.DATE,
    'ObjectId': FieldType.OBJECT_ID,
    'Array': FieldType.ARRAY,
    'Object': FieldType.OBJECT,
    'Mixed': FieldType.MIXED
  }
  return typeMap[mongoType] || FieldType.UNKNOWN
}

export const createField = (name, type, options = {}) => ({
  name,
  type,
  path: options.path || name,
  isArray: options.isArray || type === FieldType.ARRAY,
  elementType: options.elementType || null,
  children: options.children || [],
  fromStage: options.fromStage || null,
  isNew: options.isNew || false
})

export const collectionToSchema = (collection) => {
  if (!collection || !collection.fields) return []
  
  return collection.fields.map(field => createField(
    field.name,
    mongoTypeToFieldType(field.type),
    {
      path: field.name,
      elementType: field.arrayType ? mongoTypeToFieldType(field.arrayType) : null,
      isArray: field.type === 'Array'
    }
  ))
}

const transformMatch = (schema, config) => {
  return [...schema]
}

const normalizeFieldRef = (fieldRef) => {
  if (!fieldRef) return null
  if (fieldRef === '1' || fieldRef === 1) return null
  const str = String(fieldRef)
  return str.startsWith('$') ? str.slice(1) : str
}

const transformGroup = (schema, config, stageIndex) => {
  const newSchema = []
  
  const idValue = config._id
  if (idValue === 'null' || idValue === null) {
    newSchema.push(createField('_id', FieldType.MIXED, {
      fromStage: stageIndex,
      isNew: true
    }))
  } else if (idValue) {
    const fieldName = normalizeFieldRef(idValue)
    const originalField = fieldName ? schema.find(f => f.name === fieldName) : null
    newSchema.push(createField('_id', originalField?.type || FieldType.MIXED, {
      fromStage: stageIndex,
      isNew: true
    }))
  } else {
    newSchema.push(createField('_id', FieldType.MIXED, {
      fromStage: stageIndex,
      isNew: true
    }))
  }
  
  const accumulators = config.accumulators || []
  accumulators.forEach(acc => {
    if (acc.field) {
      let accType = FieldType.NUMBER
      const sourceFieldName = normalizeFieldRef(acc.sourceField)
      const sourceField = sourceFieldName ? schema.find(f => f.name === sourceFieldName) : null
      
      if (acc.accumulator === '$first' || acc.accumulator === '$last') {
        accType = sourceField?.type || FieldType.MIXED
      } else if (acc.accumulator === '$push' || acc.accumulator === '$addToSet') {
        accType = FieldType.ARRAY
      } else if (acc.accumulator === '$sum' || acc.accumulator === '$avg' || 
                 acc.accumulator === '$min' || acc.accumulator === '$max') {
        accType = FieldType.NUMBER
      } else if (acc.accumulator === '$count') {
        accType = FieldType.NUMBER
      }
      
      newSchema.push(createField(acc.field, accType, {
        fromStage: stageIndex,
        isNew: true
      }))
    }
  })
  
  return newSchema
}

const transformProject = (schema, config, stageIndex) => {
  const fields = config.fields || {}
  const fieldNames = Object.keys(fields)
  
  if (fieldNames.length === 0) return [...schema]
  
  const hasInclusions = fieldNames.some(f => fields[f] === 1 && f !== '_id')
  const hasExclusions = fieldNames.some(f => fields[f] === 0)
  
  if (hasInclusions) {
    const newSchema = []
    
    if (fields._id !== 0) {
      const idField = schema.find(f => f.name === '_id')
      if (idField) {
        newSchema.push({ ...idField })
      }
    }
    
    fieldNames.forEach(fieldName => {
      if (fieldName === '_id') return
      if (fields[fieldName] === 1) {
        const existingField = schema.find(f => f.name === fieldName)
        if (existingField) {
          newSchema.push({ ...existingField })
        } else {
          newSchema.push(createField(fieldName, FieldType.MIXED, {
            fromStage: stageIndex,
            isNew: true
          }))
        }
      } else if (typeof fields[fieldName] === 'string' || typeof fields[fieldName] === 'object') {
        newSchema.push(createField(fieldName, FieldType.MIXED, {
          fromStage: stageIndex,
          isNew: true
        }))
      }
    })
    
    return newSchema
  }
  
  if (hasExclusions) {
    return schema.filter(field => {
      return fields[field.name] !== 0
    })
  }
  
  return [...schema]
}

const transformSort = (schema, config) => {
  return [...schema]
}

const transformLimit = (schema, config) => {
  return [...schema]
}

const transformSkip = (schema, config) => {
  return [...schema]
}

const transformUnwind = (schema, config, stageIndex) => {
  const path = typeof config.path === 'string' ? config.path : config.path?.path
  if (!path) return [...schema]
  
  const fieldName = path.startsWith('$') ? path.slice(1) : path
  
  return schema.map(field => {
    if (field.name === fieldName && field.isArray) {
      return createField(field.name, field.elementType || FieldType.OBJECT, {
        path: field.path,
        isArray: false,
        fromStage: stageIndex
      })
    }
    return { ...field }
  })
}

const transformLookup = (schema, config, stageIndex, collections) => {
  const newSchema = [...schema]
  
  if (config.as) {
    const foreignCollection = collections?.find(c => c.name === config.from)
    let children = []
    
    if (foreignCollection) {
      children = collectionToSchema(foreignCollection)
    }
    
    newSchema.push(createField(config.as, FieldType.ARRAY, {
      fromStage: stageIndex,
      isNew: true,
      isArray: true,
      elementType: FieldType.OBJECT,
      children
    }))
  }
  
  return newSchema
}

const transformAddFields = (schema, config, stageIndex) => {
  const newSchema = [...schema]
  const fields = config.fields || {}
  
  Object.keys(fields).forEach(fieldName => {
    const existingIndex = newSchema.findIndex(f => f.name === fieldName)
    const newField = createField(fieldName, FieldType.MIXED, {
      fromStage: stageIndex,
      isNew: true
    })
    
    if (existingIndex >= 0) {
      newSchema[existingIndex] = newField
    } else {
      newSchema.push(newField)
    }
  })
  
  return newSchema
}

const transformCount = (schema, config, stageIndex) => {
  const fieldName = config.fieldName || 'count'
  return [createField(fieldName, FieldType.NUMBER, {
    fromStage: stageIndex,
    isNew: true
  })]
}

export const getSchemaAtStage = (stageIndex, stages, baseSchema, collections = []) => {
  let currentSchema = [...baseSchema]
  
  for (let i = 0; i <= stageIndex; i++) {
    const stage = stages[i]
    if (!stage || !stage.enabled) continue
    
    switch (stage.type) {
      case '$match':
        currentSchema = transformMatch(currentSchema, stage.config)
        break
      case '$group':
        currentSchema = transformGroup(currentSchema, stage.config, i)
        break
      case '$project':
        currentSchema = transformProject(currentSchema, stage.config, i)
        break
      case '$sort':
        currentSchema = transformSort(currentSchema, stage.config)
        break
      case '$limit':
        currentSchema = transformLimit(currentSchema, stage.config)
        break
      case '$skip':
        currentSchema = transformSkip(currentSchema, stage.config)
        break
      case '$unwind':
        currentSchema = transformUnwind(currentSchema, stage.config, i)
        break
      case '$lookup':
        currentSchema = transformLookup(currentSchema, stage.config, i, collections)
        break
      case '$addFields':
        currentSchema = transformAddFields(currentSchema, stage.config, i)
        break
      case '$count':
        currentSchema = transformCount(currentSchema, stage.config, i)
        break
      default:
        break
    }
  }
  
  return currentSchema
}

export const getFieldsBeforeStage = (stageIndex, stages, baseSchema, collections = []) => {
  if (stageIndex === 0) return baseSchema
  return getSchemaAtStage(stageIndex - 1, stages, baseSchema, collections)
}

export const schemaToFieldNames = (schema) => {
  const names = []
  
  const processField = (field, prefix = '') => {
    const fullPath = prefix ? `${prefix}.${field.name}` : field.name
    names.push(fullPath)
    
    if (field.children && field.children.length > 0) {
      field.children.forEach(child => processField(child, fullPath))
    }
  }
  
  schema.forEach(field => processField(field))
  return names
}

export const flattenSchemaForDisplay = (schema) => {
  const result = []
  
  const processField = (field, depth = 0, prefix = '') => {
    const fullPath = prefix ? `${prefix}.${field.name}` : field.name
    result.push({
      ...field,
      fullPath,
      depth,
      displayName: field.name,
      hasChildren: field.children && field.children.length > 0
    })
    
    if (field.children && field.children.length > 0) {
      field.children.forEach(child => processField(child, depth + 1, fullPath))
    }
  }
  
  schema.forEach(field => processField(field))
  return result
}

export const getFieldTypeLabel = (type) => {
  const labels = {
    [FieldType.STRING]: 'String',
    [FieldType.NUMBER]: 'Number',
    [FieldType.BOOLEAN]: 'Boolean',
    [FieldType.DATE]: 'Date',
    [FieldType.OBJECT_ID]: 'ObjectId',
    [FieldType.ARRAY]: 'Array',
    [FieldType.OBJECT]: 'Object',
    [FieldType.MIXED]: 'Mixed',
    [FieldType.UNKNOWN]: 'Unknown'
  }
  return labels[type] || 'Unknown'
}

export const getFieldTypeColor = (type) => {
  const colors = {
    [FieldType.STRING]: 'text-emerald-400',
    [FieldType.NUMBER]: 'text-blue-400',
    [FieldType.BOOLEAN]: 'text-amber-400',
    [FieldType.DATE]: 'text-purple-400',
    [FieldType.OBJECT_ID]: 'text-rose-400',
    [FieldType.ARRAY]: 'text-cyan-400',
    [FieldType.OBJECT]: 'text-orange-400',
    [FieldType.MIXED]: 'text-gray-400',
    [FieldType.UNKNOWN]: 'text-gray-500'
  }
  return colors[type] || 'text-gray-500'
}
