import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await register({ name, email, password });
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-stone-200 p-6 md:p-8">
        <div className="text-center mb-6">
          <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold tracking-wide uppercase mb-2">
            CrustCraft Artisan Bakery
          </span>
          <h1 className="text-2xl font-bold text-stone-900">
            Create your account
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Join CrustCraft to pre-order artisan baked goods
          </p>
        </div>

        {error && (
          <div
            role="alert"
            data-testid="error-state"
            className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-stone-800 mb-1"
            >
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Somsak Jaidee"
              className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-amber-600"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-stone-800 mb-1"
            >
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="somsak@test.com"
              className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-amber-600"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-stone-800 mb-1"
            >
              Password (min. 8 characters)
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-amber-600"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[44px] py-2.5 px-4 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:bg-stone-300 text-white font-semibold transition-colors"
          >
            {isSubmitting ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-stone-600">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-amber-700 hover:text-amber-800 underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
