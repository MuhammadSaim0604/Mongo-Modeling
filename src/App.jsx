import React, { useState } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import useStore from './stores/useStore'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Workspace from './components/Workspace'
import FieldEditor from './components/FieldEditor'
import CodePanel from './components/CodePanel'
import AggregationBuilder from './components/AggregationBuilder'

const App = () => {
  const { showFieldEditor, showCodePanel, showAggregationBuilder } = useStore()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <ReactFlowProvider>
      <div className="h-screen w-screen flex overflow-hidden bg-[var(--bg-base)]">
        {sidebarOpen && <Sidebar onClose={() => setSidebarOpen(false)} />}
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          
          <div className="flex-1 relative overflow-hidden">
            <Workspace />
            
            {showCodePanel && <CodePanel />}
          </div>
        </div>

        {showFieldEditor && <FieldEditor />}
        {showAggregationBuilder && <AggregationBuilder />}
      </div>
    </ReactFlowProvider>
  )
}

export default App
