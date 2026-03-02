import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { App as CapApp } from '@capacitor/app';
import { AuthProvider } from './context/AuthContext';
import { NotesProvider } from './context/NotesContext';
import FoldersView from './views/FoldersView';
import NotesListView from './views/NotesListView';
import EditorView from './views/EditorView';
import SettingsView from './views/SettingsView';
import './App.css';

const AnimatedRoutes = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // 監聽 Android 硬體返回鍵
  useEffect(() => {
    const handler = CapApp.addListener('backButton', () => {
      if (location.pathname !== '/') {
        navigate(-1);       // 不在首頁 → 返回上一頁
      } else {
        CapApp.exitApp();   // 已在首頁 → 退出 App
      }
    });

    return () => { handler.then(h => h.remove()); };
  }, [location.pathname, navigate]);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<FoldersView />} />
        <Route path="/folder/:folderName" element={<NotesListView />} />
        <Route path="/note/:noteId" element={<EditorView />} />
        <Route path="/settings" element={<SettingsView />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotesProvider>
          <div className="app-container">
            <AnimatedRoutes />
          </div>
        </NotesProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
