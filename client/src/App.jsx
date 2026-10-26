import { AuthProvider } from "./context/AuthContext.jsx";
import AppRoutes from "./layout.jsx";

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}