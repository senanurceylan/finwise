import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Register({ onSwitchLogin }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalı.');
      return;
    }
    setSubmitting(true);
    try {
      await register(name.trim(), email.trim(), password);
    } catch (err) {
      setError(err.message || err.data?.error || 'Kayıt oluşturulamadı.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-card card">
      <h2 className="auth-title">Kayıt Ol</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        {error && <p className="auth-error">{error}</p>}
        <div className="form-field">
          <label htmlFor="reg-name">Ad Soyad</label>
          <input
            id="reg-name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="reg-email">E-posta</label>
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="reg-password">Şifre (en az 6 karakter)</label>
          <input
            id="reg-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Kaydediliyor...' : 'Kayıt Ol'}
        </button>
        <p className="auth-switch">
          Zaten hesabınız var mı?{' '}
          <button type="button" className="auth-link" onClick={onSwitchLogin}>
            Giriş yapın
          </button>
        </p>
      </form>
    </div>
  );
}
