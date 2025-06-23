import App from './App.jsx';
import { createBrowserRouter as createRouter, redirect, Outlet } from 'react-router-dom'
import { useStore } from './store'
import ErrorPage from './views/ErrorPage.jsx'
import LoadingOverlay from './components/LoadingOverlay.jsx'
import Login from './views/Login.jsx'

// Lit组件包装器
const LitWrapper = ({ tagName, props = {} }) => {
  const ref = React.useRef(null);
  
  React.useEffect(() => {
    // 创建自定义元素
    if (ref.current) {
      const element = document.createElement(tagName);
      
      // 添加属性
      Object.entries(props).forEach(([key, value]) => {
        element[key] = value;
      });
      
      // 清空容器并添加元素
      ref.current.innerHTML = '';
      ref.current.appendChild(element);
    }
    
    return () => {
      if (ref.current) {
        ref.current.innerHTML = '';
      }
    };
  }, [tagName, props]);
  
  return <div ref={ref}></div>;
};

// 懒加载组件
const UserDashboard = React.lazy(() => import('./views/UserDashboard.jsx'));
const NotFound = React.lazy(() => import('./views/NotFound.jsx'));
const DeviceManagementView = React.lazy(() => import('./views/DeviceManagementView.jsx'));
const AdminDashboard = React.lazy(() => import('./views/AdminDashboard.js'));
const MerchantDashboard = React.lazy(() => import('./views/MerchantDashboard.js'));

// 预加载Lit组件
const preloadLitComponent = async (path) => {
  try {
    // 清除缓存以确保正确加载
    delete window.webpackHotUpdate;
    // @vite-ignore 动态导入视图组件
    await import(/* @vite-ignore */ path);
    console.log(`已预加载组件: ${path}`);
    return true;
  } catch (error) {
    console.error(`预加载组件失败: ${path}`, error);
    return false;
  }
};

export default createRouter([
  {
    path: '/',
    hydrateFallback: <LoadingOverlay visible={true} />,
    element: <App><Outlet /></App>,
    errorElement: <ErrorPage />,
    loader: async ({ request, params }) => {
      await new Promise(resolve => {
        const unsub = useStore.subscribe((state) => {
          if (state._hasHydrated) {
            resolve()
            unsub()
          }
        })
      })
      
      const { currentUser, _hasHydrated } = useStore.getState()
      const { pathname } = new URL(request.url)
      const routeMeta = request.matchedRoute?.meta

      console.log('[Router] 状态水合完成 _hasHydrated:', _hasHydrated)
      console.log('[Router] 当前用户:', currentUser)
      console.log('[Router] 请求路径:', pathname)
      console.log('[Router] 路由元信息:', routeMeta)

      // 路由守卫逻辑
      if (routeMeta?.requiresAuth && !currentUser) {
        return redirect(`/?redirect=${encodeURIComponent(pathname)}`)
      }
      if (routeMeta?.role && currentUser?.role !== routeMeta.role) {
        console.warn('[Router] 角色不匹配 当前:', currentUser?.role, '要求:', routeMeta.role)
        return redirect('/unauthorized')
      }
      return null
    },
    children: [
      {
        path: '/',
        element: <React.Suspense fallback={<LoadingOverlay />}>
          <Login />
        </React.Suspense>
      },
      {
        path: '/login',
        element: <React.Suspense fallback={<LoadingOverlay />}>
          <Login />
        </React.Suspense>
      },
      {
        path: '/payment',
        element: <React.Suspense fallback={<LoadingOverlay />}>
          <LitWrapper tagName="payment-view" />
        </React.Suspense>,
        loader: async () => {
          await preloadLitComponent('./views/Payment.js');
          return null;
        },
        meta: { requiresAuth: true }
      },
      {
        path: '/user',
        element: <React.Suspense fallback={<LoadingOverlay />}>
          <UserDashboard />
        </React.Suspense>,
        meta: { requiresAuth: true, role: 'user' }
      },
      {
        path: '/device-management',
        element: <React.Suspense fallback={<LoadingOverlay />}>
          <DeviceManagementView />
        </React.Suspense>,
        meta: { requiresAuth: true }
      },
      {
        path: '/merchant',
        element: <React.Suspense fallback={<LoadingOverlay />}>
        <MerchantDashboard />
      </React.Suspense>,
        meta: { requiresAuth: true, role: 'merchant' }
      },
      {
        path: '/admin',
        element: <React.Suspense fallback={<LoadingOverlay />}>
        <AdminDashboard />
      </React.Suspense>,
        meta: { requiresAuth: true, role: 'admin' }
      },
      {
        path: '*',
        element: <React.Suspense fallback={<LoadingOverlay />}>
          <NotFound />
        </React.Suspense>
      }
    ]
  }
])