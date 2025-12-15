import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Header from './components/Layout/Header';
import Navigation from './components/Layout/Navigation';
import AdminPanel from './components/Admin/AdminPanel';
import HostDashboard from './components/Host/HostDashboard';
import PlayerDashboard from './components/Player/PlayerDashboard';
import './App.css';

function AppContent() {
  const { currentUser } = useAuth();
  const [showRegister, setShowRegister] = useState(false);
  const [activeView, setActiveView] = useState('player');

  if (!currentUser) {
    return showRegister ? (
      <Register onToggleLogin={() => setShowRegister(false)} />
    ) : (
      <Login onToggleRegister={() => setShowRegister(true)} />
    );
  }

  const renderView = () => {
    switch (activeView) {
      case 'admin':
        return <AdminPanel />;
      case 'host':
        return <HostDashboard />;
      case 'player':
      default:
        return <PlayerDashboard />;
    }
  };

  return (
    <div className="app">
      <Header />
      <Navigation activeView={activeView} onNavigate={setActiveView} />
      <main className="app-main">
        {renderView()}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
