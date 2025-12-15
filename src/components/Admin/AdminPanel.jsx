import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import './Admin.css';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

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

      <div className="users-list">
        <div className="users-header">
          <div>Käyttäjä</div>
          <div>Sähköposti</div>
          <div>Rooli</div>
          <div>Toiminnot</div>
        </div>

        {users.map(user => (
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

        {users.length === 0 && (
          <div className="no-users">Ei käyttäjiä</div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
