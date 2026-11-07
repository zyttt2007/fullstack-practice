import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { ProtectedRoute } from './components/ui';
import Home from './pages/Home';
import QuestionDetail from './pages/QuestionDetail';
import Ask from './pages/Ask';
import Leaderboard from './pages/Leaderboard';
import Mine from './pages/Mine';
import Login from './pages/Login';
import Register from './pages/Register';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/question/:id" element={<QuestionDetail />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/ask"
          element={
            <ProtectedRoute>
              <Ask />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mine"
          element={
            <ProtectedRoute>
              <Mine />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Layout>
  );
}
