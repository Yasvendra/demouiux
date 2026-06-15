import { Route, Routes } from 'react-router-dom'
import Design from './pages/design'


function App() {
  return (
    <Routes>
      <Route path="/"  >
        <Route index element={<Design />} />
       </Route>
    </Routes>
  )
}

export default App
