// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import GlobalStyles from './styles/GlobalStyles';
import LandingPage from './components/LandingPage';
import Timeline from './components/Timeline';
import DocumentViewer from './components/DocumentViewer';

function App() {
  return (
    <Router>
      <GlobalStyles />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/document/:id" element={<DocumentViewer />} />
      </Routes>
    </Router>
  );
}

export default App;
