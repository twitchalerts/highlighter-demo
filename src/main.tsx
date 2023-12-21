import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { RouterProvider } from 'react-router5';
import router from './router';
import { swrApi } from './api.ts';

const swrClient = swrApi.createClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  // <React.StrictMode>
    <RouterProvider router={router}>
      <swrApi.Provider client={swrClient}>
        <App />
      </swrApi.Provider>
    </RouterProvider>
  // </React.StrictMode>,
)
