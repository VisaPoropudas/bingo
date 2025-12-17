import { useState } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';

const SetupAdmin = () => {
  const { currentUser } = useAuth();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const makeAdmin = async () => {
    if (!currentUser) {
      setMessage('Et ole kirjautunut sisään');
      return;
    }

    setLoading(true);
    try {
      // Tarkista onko dokumentti olemassa
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        // Päivitä olemassa oleva dokumentti
        await setDoc(userDocRef, {
          ...userDoc.data(),
          role: 'admin'
        });
      } else {
        // Luo uusi dokumentti
        await setDoc(userDocRef, {
          email: currentUser.email,
          displayName: currentUser.displayName || currentUser.email,
          role: 'admin',
          createdAt: new Date().toISOString()
        });
      }

      setMessage('✅ Sinut on nyt tehty adminiksi! Päivitä sivu.');
    } catch (error) {
      console.error('Error updating role:', error);
      setMessage('❌ Virhe: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '500px',
      margin: '2rem auto',
      padding: '2rem',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <h2>Admin-työkalu</h2>
      <p>Käyttäjä: {currentUser?.email}</p>
      <p>Nykyinen rooli: {localStorage.getItem('userRole') || 'ladataan...'}</p>

      <button
        onClick={makeAdmin}
        disabled={loading}
        style={{
          width: '100%',
          padding: '1rem',
          marginTop: '1rem',
          background: 'linear-gradient(135deg, #1e3a5f 0%, #0A1929 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '1rem',
          fontWeight: '600',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Päivitetään...' : 'Tee minusta Admin'}
      </button>

      {message && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          background: message.includes('✅') ? '#d4edda' : '#f8d7da',
          borderRadius: '6px'
        }}>
          {message}
        </div>
      )}

      <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
        Tämä komponentti päivittää roolisi adminiksi Firestoressa.
        Päivitä sivu muutosten näkemiseksi.
      </p>
    </div>
  );
};

export default SetupAdmin;
