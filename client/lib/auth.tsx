import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

interface AuthContextType {
  userId: string | null;
  userName: string | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContextInternal = createContext<AuthContextType>({
    userId: null,
    userName : null,
    loading: true,
    logout: async () => {},
  });
  
  export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
     const navigate = useNavigate();
    const [userId, setUserId] = useState<string | null>(null);
    const [userName, setUserName] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuthStore();
  
    const checkAuth = async () => {
      try {
        if(user){
          setUserId(user.id);
          setUserName(user.username)
          console.log("checlok");
          
        }

        const res = await axios.get("/api/me", { withCredentials: true });
        if(res?.data){
          setUserId(res?.data?.userId);
          console.log("data",res?.data?.userName);
          
          setUserName(res.data.userName)
          
        }
      } catch {
        setUserId(null);
      } finally {
        setLoading(false);
      }
    };
  
    useEffect(() => {
      checkAuth();
    }, [user]);
  
    const logout = async () => {
      try {
        await axios.post("/api/auth/logout", {}, { withCredentials: true });
      navigate('/login')
      setUserId(null);
      } catch (error) {
        
      }
    };
  
    return (
      <AuthContextInternal.Provider value={{ userId, loading, logout, userName }}>
        {children}
      </AuthContextInternal.Provider>
    );
  };
  
  export const useAuth = () => useContext(AuthContextInternal);
  