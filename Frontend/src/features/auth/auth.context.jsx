import { children, createContext ,useState , useContext } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({children}) =>{
  const [user, setUser] = useState(null);
  const [loading, setloading] = useState(false); 

  return(
    <AuthContext.Provider value ={{user,setUser, loading, setloading}}>
      {children}

    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  return useContext(AuthContext);
};