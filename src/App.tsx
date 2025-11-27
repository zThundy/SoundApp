import { useEffect, useState } from 'react'

import style from './App.module.css'
import theme from './mui/StyleProvider'

import { ThemeProvider } from '@mui/material'

import { HashRouter, Routes, Route, useLocation } from 'react-router'

import Login from "@/components/login"
import Home from "@/components/home"
import NotFound from "@/components/error/404"

function App() {
  return (
    <ThemeProvider theme={theme}>
      <div className={style.appScroll}>
        <HashRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/home" element={<Home />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </div>
    </ThemeProvider>
  )
}

export default App