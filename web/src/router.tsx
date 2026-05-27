import { createBrowserRouter } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import { TreePage } from '@/pages/TreePage';

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/trees/:treeId', element: <TreePage /> },
]);
