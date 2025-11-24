import { useState } from 'react'

import style from './App.module.css'
import theme from './mui/StyleProvider'

import { ThemeProvider } from '@mui/material'

import { BrowserRouter, Routes, Route } from 'react-router'

import Login from "@/components/login"
import Home from "@/components/home"
import NotFound from "@/components/error/404"

// <Button onClick={() => setCount((count) => count + 1)} variant="contained" color="primary">
//   count is {count}
// </Button>

// <Button onClick={() => setCount((count) => count + 1)} disabled variant="contained" color="primary">
//   count is {count}
// </Button>

// <Button onClick={() => setCount((count) => count + 1)} variant='outlined' color="secondary">
//   count is {count}
// </Button>

// <Button onClick={() => setCount((count) => count + 1)} disabled variant='outlined' color="secondary">
//   count is {count}
// </Button>

function App() {
  const [count, setCount] = useState(0)

  return (
    <ThemeProvider theme={theme}>
      <div className={style.appScroll}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/home" element={<Home />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </div>
    </ThemeProvider>
  )
}

export default App