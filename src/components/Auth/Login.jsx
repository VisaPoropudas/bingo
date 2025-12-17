import { useState } from 'react';
import { signInWithGoogle, signInWithEmail } from '../../firebase/auth';
import { Google } from 'react-bootstrap-icons';
import './Auth.css';

const Login = ({ onToggleRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      setError('Kirjautuminen epäonnistui: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmail(email, password);
    } catch (err) {
      setError('Kirjautuminen epäonnistui: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Visan BINGO</h1>
        <h2>Kirjaudu sisään</h2>

        {error && <div className="error-message">{error}</div>}

        <button
          className="google-btn"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <Google size={20} /> Kirjaudu Google-tilillä
        </button>

        <div className="divider">
          <span>tai</span>
        </div>

        <form onSubmit={handleEmailSignIn}>
          <div className="form-group">
            <label htmlFor="email">Sähköposti</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nimi@esimerkki.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Salasana</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Kirjaudutaan...' : 'Kirjaudu'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Eikö sinulla ole tiliä?{' '}
            <button onClick={onToggleRegister} className="link-btn">
              Rekisteröidy
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
