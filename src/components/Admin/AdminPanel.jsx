import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Search } from 'react-bootstrap-icons';
import './Admin.css';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      setMessage('Virhe käyttäjien lataamisessa');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole
      });

      setUsers(users.map(user =>
        user.id === userId ? { ...user, role: newRole } : user
      ));

      setMessage(`Käyttäjän rooli päivitetty: ${newRole}`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating user role:', error);
      setMessage('Virhe roolin päivittämisessä');
    }
  };

  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    const displayName = (user.displayName || '').toLowerCase();
    const email = (user.email || '').toLowerCase();
    return displayName.includes(query) || email.includes(query);
  });

  if (loading) {
    return <div className="loading">Ladataan...</div>;
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>Hallintapaneeli</h1>
        <p>Hallitse käyttäjien rooleja</p>
      </div>

      {message && (
        <div className="admin-message">{message}</div>
      )}

      <div className="search-box" style={{ marginBottom: '1.5rem' }}>
        <div className="search-input-wrapper" style={{
          position: 'relative',
          maxWidth: '500px',
          display: 'flex',
          alignItems: 'center',
          background: 'white',
          border: '2px solid #e0e0e0',
          borderRadius: '8px',
          padding: '0.5rem 1rem',
          transition: 'border-color 0.2s'
        }}>
          <Search size={20} style={{ color: 'var(--text-secondary)', marginRight: '0.75rem' }} />
          <input
            type="text"
            placeholder="Hae nimellä tai sähköpostilla..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              flex: 1,
              fontSize: '1rem',
              background: 'transparent'
            }}
            onFocus={(e) => e.target.parentElement.style.borderColor = 'var(--primary-main)'}
            onBlur={(e) => e.target.parentElement.style.borderColor = '#e0e0e0'}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '1.2rem',
                padding: '0 0.25rem'
              }}
            >
              ×
            </button>
          )}
        </div>
        <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Näytetään {filteredUsers.length} / {users.length} käyttäjää
        </p>
      </div>

      <div className="users-list">
        <div className="users-header">
          <div>Käyttäjä</div>
          <div>Sähköposti</div>
          <div>Rooli</div>
          <div>Toiminnot</div>
        </div>

        {filteredUsers.map(user => (
          <div key={user.id} className="user-row">
            <div className="user-name">{user.displayName || 'Ei nimeä'}</div>
            <div className="user-email">{user.email}</div>
            <div className="user-role">
              <span className={`role-badge role-${user.role}`}>
                {user.role}
              </span>
            </div>
            <div className="user-actions">
              <select
                value={user.role}
                onChange={(e) => updateUserRole(user.id, e.target.value)}
                className="role-select"
              >
                <option value="pelaaja">Pelaaja</option>
                <option value="pitäjä">Pitäjä</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
        ))}

        {filteredUsers.length === 0 && users.length > 0 && (
          <div className="no-users">Ei hakutuloksia</div>
        )}

        {users.length === 0 && (
          <div className="no-users">Ei käyttäjiä</div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
