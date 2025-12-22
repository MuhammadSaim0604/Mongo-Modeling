# MongoDB Schema Designer

A fully frontend-only, backend-less visual database design and modeling web application focused exclusively on MongoDB.

This tool allows developers to visually design MongoDB schemas, define fields and relationships, and export production-ready Mongoose schemas — all directly in the browser with local persistence.

---

## 🚀 Features

### 🧩 Visual Schema Modeling
- Interactive canvas with drag-and-drop support
- Zooming, panning, and grid snapping
- Visually connect collections with relationship edges

### 📦 Collection Management
- Create, rename, and delete MongoDB collections
- Drag collections freely on the canvas

### 🧱 Field Definitions
Each field supports:
- **Data Types**
  - String, Number, Boolean, Date
  - ObjectId, Array, Object
  - Buffer, Mixed, Decimal128, Map
- **Options**
  - Required
  - Unique
  - Indexed
  - Default values
- **Validation Rules**
  - min / max
  - minLength / maxLength
  - regex pattern matching
- **Enums**
- **ObjectId References** (relationships to other collections)

### 🔗 Relationships
- Visual linking between collections
- Relationship types:
  - One-to-One (1:1)
  - One-to-Many (1:N)
  - Many-to-Many (N:M)
- Click edge labels to cycle relationship types

### 🧾 Code Generation
- Export **production-ready Mongoose schema code**
- Syntax highlighted preview
- Export schemas as ZIP files

### 📊 Aggregation Pipeline Builder
- Visual aggregation stage builder
- Supported stages:
  - `$match`
  - `$group`
  - `$project`
  - `$sort`
  - `$limit`
  - `$skip`
  - `$unwind`
  - `$lookup`
  - `$addFields`
  - `$count`
- **Schema Tracking**
  - Automatically tracks fields and types through each stage
  - Highlights newly created fields
  - Displays field count badges per stage
  - Enhanced `$project` with custom expressions

### 💾 Project Management
- Autosave using IndexedDB
- Export / import full projects as JSON
- No backend or server required

---

## 🛠 Tech Stack

- **React 18** (Vite)
- **React Flow** (`@xyflow/react`) – visual canvas
- **Zustand** – state management
- **Tailwind CSS** – UI styling
- **IndexedDB** (via `idb`) – local storage
- **Prism React Renderer** – code highlighting
- **JSZip & FileSaver** – exports

---

## 📁 Project Structure

```bash
src/
├── App.jsx # Main application with React Flow canvas
├── main.jsx # Application entry point
├── index.css # Global styles
├── components/
│ ├── CollectionNode.jsx # Collection UI node
│ ├── RelationshipEdge.jsx # Relationship edge
│ ├── FieldEditor.jsx # Field property editor modal
│ ├── Toolbar.jsx # Top toolbar actions
│ └── CodePanel.jsx # Code preview panel
├── stores/
│ └── useStore.js # Zustand store
├── generators/
│ └── mongooseGenerator.js # Mongoose schema generator
└── utils/
├── storage.js # IndexedDB & file utilities
└── schemaTracker.js # Aggregation schema tracking
```

## ▶️ Getting Started

### 1️⃣ Install Dependencies
```bash
npm install
```

### 2️⃣ Run Development Server
```bash 
npm run dev
```

The application will start on http://localhost:5000

---

### 🧭 How to Use

1. Click Add Collection to create a new collection
2. Double-click the collection name to rename it
3. Click Add Field to add fields
4. Use the edit icon to configure field properties
5. Drag from a field handle to another to create relationships
6. Click relationship labels to change relationship type
7. Open Code Panel to view generated Mongoose schemas
8. Export:
    - Project JSON
    - Mongoose schema ZIP


---

### 🧠 Architecture Notes
- Fully client-side — no backend required
- Visual modeling layer is decoupled from code generation
- Generator system is extensible (add Prisma, TypeORM, etc.)
- Safe local persistence using IndexedDB
- Designed for scalability and maintainability


---

### 📌 Use Cases

- Designing MongoDB schemas visually
- Planning database architecture
- Teaching MongoDB & Mongoose concepts
- Rapid prototyping for MERN / MEAN stacks
- Generating boilerplate Mongoose schemas

---

### 📄 License
MIT License

---

### 🤝 Contributing

Contributions are welcome!
Feel free to open issues, suggest features, or submit pull requests.

### ⭐ Support

If you find this project useful, please consider giving it a ⭐ on GitHub.


---

If you want, I can also:
- Add **badges** (React, MongoDB, License)
- Write a **short GitHub description**
- Create a **CONTRIBUTING.md**
- Create a **screenshots section**
- Optimize README for **SEO & GitHub discoverability**

Just tell me 👍
