import { createBrowserRouter } from 'react-router-dom';
import PublicLayout from '@/layouts/PublicLayout';
import AuthLayout from '@/layouts/AuthLayout';
import RequireAuth from '@/components/RequireAuth';
import Login from '@/pages/Login';
import Home from '@/pages/Home';
import Marcas from '@/pages/Marcas';
import Modelos from '@/pages/Modelos';
import Clientes from '@/pages/Clientes';
import Motos from '@/pages/Motos';
import Ordenes from '@/pages/Ordenes';

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      {
        path: '/login',
        element: <Login />
      }
    ]
  },
  {
    element: <RequireAuth><AuthLayout /></RequireAuth>,
    children: [
      {
        path: '/',
        element: <Home />
      },
      {
        path: '/home',
        element: <Home />
      },
      {
        path: '/marcas',
        element: <Marcas />
      },
      {
        path: '/modelos',
        element: <Modelos />
      },
      {
        path: '/clientes',
        element: <Clientes />
      },
      {
        path: '/motos',
        element: <Motos />
      },
      {
        path: '/ordenes',
        element: <Ordenes />
      }
    ]
  }
]);
