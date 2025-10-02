import { createContext , useState, useEffect} from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";





const backendURL = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendURL;


export const AuthContext = createContext();

export const AuthContextProvider = ({children})=>{

    const [token,setToken] = useState(localStorage.getItem('token'));
    const [authUser,setAuthUser] = useState(null);
    const [onlineUsers,setOnlineUsers] = useState([]);
    const [socket,setSocket] = useState(null);

    //check if user is authenticated and if so get user data and connect to socket
    const checkAuth = async()=>{
        try{
            const {data} = await axios.get('/api/auth/check');
            if(data.success){
                setAuthUser(data.userData);
                connectSocket(data.userData);
            }
        }catch(error){
            toast.error(error.message);
        }
    }



 //login function to handle authentication and socket connection
const login = async (state, Credentials)=>{
    
    try{
        const{data}=await axios.post(`/api/auth/${state}`,Credentials);
        if(data.success){
            setAuthUser(data.userData);
            connectSocket(data.userData);
            axios.defaults.headers.common["token"] = data.token;
            setToken(data.token);
            localStorage.setItem("token",data.token)
            toast.success(data.message)
           

        }else{
            toast.error(data.message)
        }
    }catch(error){
              toast.error(error.message)
    }
    
}


// Logout function to handle user logout and socket disconnection

     const logout = async () =>{
        localStorage.removeItem("token");
        setToken(null);
        setAuthUser(null);
        setOnlineUsers([]);
        axios.defaults.headers.common["token"]=null;
        toast.success("Logged out successfully")
        socket.disconnect();
     }


     //Update profile function to handle user profile updates
     const updateProfile =async (body)=>{
        try{
            const{ data } =await axios.put("/api/auth/update-profile",body);
            if(data.success){
                setAuthUser(data.userData);
                toast.success("profile updated successfully")

            }
        }catch (error){
            toast.error(error.message)
        }
     }



    //connect socket function to handle socket connection and events
    const connectSocket = (userData)=>{
        if(!userData || socket?.connected) return;
        const newSocket = io(backendURL,{
            query:{userId:userData._id}
        });
        newSocket.connect();
        setSocket(newSocket);
        newSocket.on('getOnlineUsers',(usersIds)=>{
            setOnlineUsers(usersIds);
        })
    
    }

    useEffect(()=>{
        if(token){
            axios.defaults.headers.common['token'] = token;
        }
        checkAuth();
    },[token]);
    


    const value = {
        axios,
        authUser,
        onlineUsers,
        socket,
        login,
        logout,
        updateProfile
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}