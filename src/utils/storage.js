import { openDB } from 'idb'

const DB_NAME = 'MongoSchemaDesigner'
const DB_VERSION = 1
const STORE_NAME = 'projects'

let dbPromise = null

const getDB = async () => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          store.createIndex('name', 'name')
          store.createIndex('updatedAt', 'updatedAt')
        }
      }
    })
  }
  return dbPromise
}

export const saveProject = async (project) => {
  const db = await getDB()
  const projectData = {
    ...project,
    id: project.id || crypto.randomUUID(),
    updatedAt: new Date().toISOString()
  }
  await db.put(STORE_NAME, projectData)
  return projectData.id
}

export const loadProject = async (id) => {
  const db = await getDB()
  return db.get(STORE_NAME, id)
}

export const getAllProjects = async () => {
  const db = await getDB()
  const projects = await db.getAll(STORE_NAME)
  return projects.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
}

export const deleteProject = async (id) => {
  const db = await getDB()
  await db.delete(STORE_NAME, id)
}

export const exportProjectAsJSON = (project) => {
  const jsonString = JSON.stringify(project, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  return blob
}

export const importProjectFromJSON = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const project = JSON.parse(e.target.result)
        resolve(project)
      } catch (error) {
        reject(new Error('Invalid JSON file'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

const AUTOSAVE_KEY = 'mongodesigner_autosave'

export const autoSave = (projectData) => {
  try {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({
      ...projectData,
      autoSavedAt: new Date().toISOString()
    }))
  } catch (e) {
    console.warn('Autosave failed:', e)
  }
}

export const loadAutoSave = () => {
  try {
    const saved = localStorage.getItem(AUTOSAVE_KEY)
    return saved ? JSON.parse(saved) : null
  } catch (e) {
    return null
  }
}

export const clearAutoSave = () => {
  localStorage.removeItem(AUTOSAVE_KEY)
}
