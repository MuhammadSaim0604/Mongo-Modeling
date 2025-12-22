const getTypeString = (field, collections) => {
  const baseType = field.type

  if (baseType === 'ObjectId' && field.ref) {
    return `mongoose.Schema.Types.ObjectId`
  }

  switch (baseType) {
    case 'String':
    case 'Number':
    case 'Boolean':
    case 'Date':
      return baseType
    case 'ObjectId':
      return 'mongoose.Schema.Types.ObjectId'
    case 'Array':
      return '[mongoose.Schema.Types.Mixed]'
    case 'Object':
      return 'Object'
    case 'Buffer':
      return 'Buffer'
    case 'Mixed':
      return 'mongoose.Schema.Types.Mixed'
    case 'Decimal128':
      return 'mongoose.Schema.Types.Decimal128'
    case 'Map':
      return 'Map'
    default:
      return 'String'
  }
}

const generateFieldDefinition = (field, collections, indent = '    ') => {
  if (field.name === '_id') {
    return null
  }

  const hasOptions = field.required || field.unique || field.index ||
    field.default || (field.enum && field.enum.length > 0) || field.ref ||
    Object.values(field.validation || {}).some(v => v !== null && v !== '')

  if (!hasOptions) {
    return `${indent}${field.name}: ${getTypeString(field, collections)}`
  }

  const options = []
  options.push(`type: ${getTypeString(field, collections)}`)

  if (field.ref) {
    const refCollection = collections.find(c => c.id === field.ref)
    if (refCollection) {
      options.push(`ref: '${refCollection.data.name}'`)
    }
  }

  if (field.required) {
    options.push(`required: true`)
  }

  if (field.unique) {
    options.push(`unique: true`)
  }

  if (field.index && !field.unique) {
    options.push(`index: true`)
  }

  if (field.default) {
    if (field.type === 'String') {
      options.push(`default: '${field.default}'`)
    } else if (field.type === 'Boolean') {
      options.push(`default: ${field.default === 'true'}`)
    } else if (field.type === 'Number') {
      options.push(`default: ${field.default}`)
    } else if (field.type === 'Date' && field.default === 'now') {
      options.push(`default: Date.now`)
    } else {
      options.push(`default: ${field.default}`)
    }
  }

  if (field.enum && field.enum.length > 0) {
    const enumValues = field.enum.map(v => `'${v}'`).join(', ')
    options.push(`enum: [${enumValues}]`)
  }

  const validation = field.validation || {}
  if (validation.min !== null && validation.min !== '' && validation.min !== undefined) {
    options.push(`min: ${validation.min}`)
  }
  if (validation.max !== null && validation.max !== '' && validation.max !== undefined) {
    options.push(`max: ${validation.max}`)
  }
  if (validation.minLength !== null && validation.minLength !== '' && validation.minLength !== undefined) {
    options.push(`minlength: ${validation.minLength}`)
  }
  if (validation.maxLength !== null && validation.maxLength !== '' && validation.maxLength !== undefined) {
    options.push(`maxlength: ${validation.maxLength}`)
  }
  if (validation.match) {
    options.push(`match: /${validation.match}/`)
  }

  const optionsStr = options.map(opt => `${indent}  ${opt}`).join(',\n')
  return `${indent}${field.name}: {\n${optionsStr}\n${indent}}`
}

export const generateSchemaCode = (collection, allCollections) => {
  const fields = collection.data.fields.filter(f => f.name !== '_id')
  const fieldDefinitions = fields
    .map(f => generateFieldDefinition(f, allCollections))
    .filter(Boolean)
    .join(',\n')

  const schemaOptions = []
  if (collection.data.timestamps) {
    schemaOptions.push('timestamps: true')
  }

  const optionsString = schemaOptions.length > 0
    ? `, {\n  ${schemaOptions.join(',\n  ')}\n}`
    : ''

  const code = `const mongoose = require('mongoose');

const ${collection.data.name}Schema = new mongoose.Schema({
${fieldDefinitions}
}${optionsString});

const ${collection.data.name} = mongoose.model('${collection.data.name}', ${collection.data.name}Schema);

module.exports = ${collection.data.name};
`

  return code
}

export const generateAllSchemas = (collections) => {
  const schemas = {}

  collections.forEach(collection => {
    const fileName = `${collection.data.name.toLowerCase()}.model.js`
    schemas[fileName] = generateSchemaCode(collection, collections)
  })

  return schemas
}

export const generateIndexFile = (collections) => {
  const imports = collections
    .map(c => `const ${c.data.name} = require('./${c.data.name.toLowerCase()}.model');`)
    .join('\n')

  const exports = collections
    .map(c => `  ${c.data.name}`)
    .join(',\n')

  return `${imports}

module.exports = {
${exports}
};
`
}

export const generateDBConnection = () => {
  return `const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/myapp');

    console.log(\`MongoDB Connected: \${conn.connection.host}\`);
  } catch (error) {
    console.error(\`Error: \${error.message}\`);
    process.exit(1);
  }
};

module.exports = connectDB;
`
}

export const generateFullProject = (collections, projectName) => {
  const files = {}

  files['db.js'] = generateDBConnection()
  files['models/index.js'] = generateIndexFile(collections)

  collections.forEach(collection => {
    const fileName = `models/${collection.data.name.toLowerCase()}.model.js`
    files[fileName] = generateSchemaCode(collection, collections)
  })

  return files
}
