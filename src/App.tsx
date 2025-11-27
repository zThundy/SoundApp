import { useEffect, useState } from 'react'

import style from './App.module.css'
import theme from './mui/StyleProvider'

import { ThemeProvider } from '@mui/material'
import { TranslationProvider } from '@/i18n/TranslationProvider'

import { HashRouter, Routes, Route, useLocation } from 'react-router'

import Login from "@/components/login"
import Home from "@/components/home"
import NotFound from "@/components/error/404"

function App() {
  return (
    <TranslationProvider>
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
    </TranslationProvider>
  )
}

export default App