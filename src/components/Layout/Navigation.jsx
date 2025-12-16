import { useAuth } from '../../contexts/AuthContext';
import './Layout.css';

const Navigation = ({ activeView, onNavigate }) => {
  const { isAdmin, isHost } = useAuth();

  return (
    <nav className="app-nav">
      <div className="nav-content">
        <button
          className={`nav-btn ${activeView === 'player' ? 'active' : ''}`}
          onClick={() => onNavigate('player')}
        >
          🎮 Pelaa
        </button>

        {isHost && (
          <button
            className={`nav-btn ${activeView === 'host' ? 'active' : ''}`}
            onClick={() => onNavigate('host')}
          >
            🎯 Pitäjä
          </button>
        )}

        {isAdmin && (
          <button
            className={`nav-btn ${activeView === 'admin' ? 'active' : ''}`}
            onClick={() => onNavigate('admin')}
          >
            ⚙️ Hallinta
          </button>
        )}

      </div>
    </nav>
  );
};

export default Navigation;
