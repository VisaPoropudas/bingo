import { useState } from 'react';
import { signInWithGoogle, registerWithEmail } from '../../firebase/auth';
import './Auth.css';

const Register = ({ onToggleLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      setError('Rekisteröityminen epäonnistui: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Salasanat eivät täsmää');
      return;
    }

    if (password.length < 6) {
      setError('Salasanan on oltava vähintään 6 merkkiä');
      return;
    }

    setLoading(true);

    try {
      await registerWithEmail(email, password, displayName);
    } catch (err) {
      setError('Rekisteröityminen epäonnistui: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Visan BINGO</h1>
        <h2>Luo tili</h2>

        {error && <div className="error-message">{error}</div>}

        <button
          className="google-btn"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <span>🔐</span> Jatka Google-tilillä
        </button>

        <div className="divider">
          <span>tai</span>
        </div>

        <form onSubmit={handleEmailRegister}>
          <div className="form-group">
            <label htmlFor="displayName">Näyttönimi</label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Nimesi"
              required
            />
          </div>

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
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Vahvista salasana</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Luodaan tiliä...' : 'Rekisteröidy'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Onko sinulla jo tili?{' '}
            <button onClick={onToggleLogin} className="link-btn">
              Kirjaudu sisään
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
