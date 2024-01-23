import { useState } from 'react'
import { create } from 'zustand'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { initStore } from './utils/store'
import AudioWaveform from './components/AudioWaveform'
import WaveSurferComponent from './components/WaveSurferPlayer'
import { useRoute, withRouter } from 'react-router5';
import { HomePage } from './pages/HomePage'
import { VideoPage } from './pages/VideoPage'
import MainLayout from './pages/MainLayout'

class AppController {
  store = initStore({

  })
}

function App() {
  const { route } = useRoute()
  const topRouteName = route.name.split('.')[0];
  console.log(topRouteName);

  if (topRouteName === 'home') {
    return <MainLayout><HomePage /></MainLayout> 
  }

  if (topRouteName === 'video') {
    return <MainLayout><VideoPage /></MainLayout> 
  }


  return (
    <>
      Page Not Found
    </>
  )
}

export default App
