import { useAuth } from '../../contexts/AuthContext';
import { Controller, Bullseye, GearFill } from 'react-bootstrap-icons';
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
          <Controller size={18} /> Pelaa
        </button>

        {isHost && (
          <button
            className={`nav-btn ${activeView === 'host' ? 'active' : ''}`}
            onClick={() => onNavigate('host')}
          >
            <Bullseye size={18} /> Pitäjä
          </button>
        )}

        {isAdmin && (
          <button
            className={`nav-btn ${activeView === 'admin' ? 'active' : ''}`}
            onClick={() => onNavigate('admin')}
          >
            <GearFill size={18} /> Hallinta
          </button>
        )}

      </div>
    </nav>
  );
};

export default Navigation;
