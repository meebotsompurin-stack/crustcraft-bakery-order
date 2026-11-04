import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
  useNavigate,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { OperatorOrderQueuePage } from './pages/OperatorOrderQueuePage';
import { OperatorOrderDetailPage } from './pages/OperatorOrderDetailPage';
import { CatalogPage } from './pages/CatalogPage';
import { OrderPage } from './pages/OrderPage';
import { MyOrdersPage } from './pages/MyOrdersPage';
import { OrderDetailPage } from './pages/OrderDetailPage';

export const formatTHB = (satang: number): string =>
  `฿${(satang / 100).toFixed(2)}`;

const TopNavbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
        <Link
          to={user?.role === 'OPERATOR' ? '/operator/orders' : '/catalog'}
          className="text-lg font-bold text-amber-800 tracking-tight"
        >
          CrustCraft Bakery
        </Link>

        {user ? (
          <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-stone-700">
            {user.role === 'CUSTOMER' && (
              <>
                <Link to="/catalog" className="hover:text-amber-700">
                  Catalog
                </Link>
                <Link to="/orders/new" className="hover:text-amber-700">
                  New Pre-Order
                </Link>
                <Link to="/orders" className="hover:text-amber-700">
                  My Orders
                </Link>
              </>
            )}

            {user.role === 'OPERATOR' && (
              <>
                <Link to="/operator/orders" className="hover:text-amber-700">
                  Order Queue
                </Link>
                <Link to="/catalog" className="hover:text-amber-700">
                  Catalog View
                </Link>
              </>
            )}

            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
              {user.name} ({user.role})
            </span>

            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-semibold"
            >
              Logout
            </button>
          </nav>
        ) : (
          <nav className="flex items-center gap-3 text-sm font-medium">
            <Link
              to="/login"
              className="text-stone-700 hover:text-amber-700 px-2 py-1"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg"
            >
              Register
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
};

const PortalPlaceholder: React.FC<{ title: string; subtitle: string }> = ({
  title,
  subtitle,
}) => (
  <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
    <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center">
      <h2 className="text-xl font-bold text-stone-900">{title}</h2>
      <p className="text-sm text-stone-600 mt-2">{subtitle}</p>
    </div>
  </div>
);

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 overflow-x-hidden">
          <TopNavbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Navigate to="/catalog" replace />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              <Route
                path="/catalog"
                element={
                  <ProtectedRoute allowedRoles={['CUSTOMER', 'OPERATOR']}>
                    <CatalogPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/orders/new"
                element={
                  <ProtectedRoute allowedRoles={['CUSTOMER']}>
                    <OrderPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/orders"
                element={
                  <ProtectedRoute allowedRoles={['CUSTOMER']}>
                    <MyOrdersPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/my-orders"
                element={<Navigate to="/orders" replace />}
              />

              <Route
                path="/orders/:id"
                element={
                  <ProtectedRoute allowedRoles={['CUSTOMER']}>
                    <OrderDetailPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/operator/orders"
                element={
                  <ProtectedRoute allowedRoles={['OPERATOR']}>
                    <OperatorOrderQueuePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/operator/orders/:id"
                element={
                  <ProtectedRoute allowedRoles={['OPERATOR']}>
                    <OperatorOrderDetailPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
