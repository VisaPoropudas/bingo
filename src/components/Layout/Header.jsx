import { signOut } from '../../firebase/auth';
import { useAuth } from '../../contexts/AuthContext';
import './Layout.css';

const Header = () => {
  const { currentUser, userRole } = useAuth();

  const handleSignOut = async () => {
    if (window.confirm('Haluatko varmasti kirjautua ulos?')) {
      await signOut();
    }
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <h1 className="app-title">🎱 Visan BINGO</h1>
        {currentUser && (
          <div className="header-user">
            <div className="user-info">
              <span className="user-name">
                {currentUser.displayName || currentUser.email}
              </span>
              <span className={`user-role role-${userRole}`}>
                {userRole}
              </span>
            </div>
            <button onClick={handleSignOut} className="sign-out-btn">
              Kirjaudu ulos
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
