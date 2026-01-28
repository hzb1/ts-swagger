import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Home from './pages/home/Home.tsx'

import 'dayjs/locale/zh-cn';

import zhCN from 'antd/locale/zh_CN';

import {ConfigProvider} from "antd";
import { createBrowserRouter, RouterProvider } from "react-router";

const router = createBrowserRouter([
  {
    path: "/",
    Component: Home,
    // loader: loadRootData,
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider locale={zhCN}>
       <RouterProvider router={router} />
    </ConfigProvider>
  </StrictMode>,
)
