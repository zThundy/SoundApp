import { useEffect, useState } from 'react'

import style from './App.module.css'
import theme from './mui/StyleProvider'

import { ThemeProvider } from '@mui/material'
import { TranslationProvider } from '@/i18n/TranslationProvider'

import { HashRouter, Routes, Route, useNavigate } from 'react-router'

import Login from "@/components/login"
import Home from "@/components/home"
import UpdateRoutePage from "@/components/update"
import NotFound from "@/components/error/404"

// Navigatore che intercetta gli eventi di update e reindirizza alla pagina /update
const UpdateNavigator = () => {
  const navigate = useNavigate()
  useEffect(() => {
    const onUpdateCanAvailable = (_e: any, info: any) => {
      if (info?.update) navigate('/update')
    }
    const onDownloadProgress = () => navigate('/update')
    const onUpdateDownloaded = () => navigate('/update')
    const onUpdaterProgress = () => navigate('/update')
    const onUpdaterDownloaded = () => navigate('/update')
    const onUpdaterAvailable = () => navigate('/update')

    window.ipcRenderer.on('update-can-available', onUpdateCanAvailable)
    window.ipcRenderer.on('download-progress', onDownloadProgress)
    window.ipcRenderer.on('update-downloaded', onUpdateDownloaded)
    window.ipcRenderer.on('updater:download-progress', onUpdaterProgress)
    window.ipcRenderer.on('updater:downloaded', onUpdaterDownloaded)
    window.ipcRenderer.on('updater:available', onUpdaterAvailable)

    return () => {
      window.ipcRenderer.off('update-can-available', onUpdateCanAvailable)
      window.ipcRenderer.off('download-progress', onDownloadProgress)
      window.ipcRenderer.off('update-downloaded', onUpdateDownloaded)
      window.ipcRenderer.off('updater:download-progress', onUpdaterProgress)
      window.ipcRenderer.off('updater:downloaded', onUpdaterDownloaded)
      window.ipcRenderer.off('updater:available', onUpdaterAvailable)
    }
  }, [])
  return null
}

function App() {
  return (
    <TranslationProvider>
      <ThemeProvider theme={theme}>
        <div className={style.appScroll}>
          <HashRouter>
            <UpdateNavigator />
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/home" element={<Home />} />
              <Route path="/update" element={<UpdateRoutePage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </HashRouter>
        </div>
      </ThemeProvider>
    </TranslationProvider>
  )
}

export default App