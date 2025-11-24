import { useState } from 'react'
import UpdateElectron from '@/components/update'
import TitleBar from '@/components/titleBar'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  return (
    <div className='App'>
      <TitleBar />

      <UpdateElectron />
    </div>
  )
}

export default App