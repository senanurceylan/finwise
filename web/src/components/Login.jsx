import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login({ onSwitchRegister }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err.message || err.data?.error || 'Giriş yapılamadı.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-card card">
      <h2 className="auth-title">Giriş Yap</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        {error && <p className="auth-error">{error}</p>}
        <div className="form-field">
          <label htmlFor="login-email">E-posta</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="login-password">Şifre</label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Giriş yapılıyor...' : 'Giriş Yap'}
        </button>
        <p className="auth-switch">
          Hesabınız yok mu?{' '}
          <button type="button" className="auth-link" onClick={onSwitchRegister}>
            Kayıt olun
          </button>
        </p>
      </form>
    </div>
  );
}
