import { Route, Routes } from 'react-router-dom'
import Design from './pages/design'


function App() {
  return (
    <div className="h-full min-h-0">
      <Routes>
        <Route path="/">
          <Route index element={<Design />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App
