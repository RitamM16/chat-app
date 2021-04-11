import { createContext, useState } from "react";
import * as Cookies from "js-cookie";

export interface AuthContextProps {}

export interface authProfile {
    id: number;
    name: string;
}

//@ts-ignore
export const AuthContext = createContext<{
    auth: authProfile | null, 
    setauth: React.Dispatch<React.SetStateAction< authProfile | null>>,
    login: (session: authProfile) => void,
    logout: () => void
}>();
 
/**
 * A Context Component that provides the authentication state to its children
 */
const AuthContextProvider: React.FunctionComponent<AuthContextProps> = (props) => {

    /**
     * This function is sets the auth state and also updates it in the cookie,
     * so it persists browser refreshes
     * @param session The auth profile of the user
     */
    const login = (session: authProfile): void => {
        Cookies.remove("session");
        Cookies.set("session", session, { expires: 14 });
        setauth(session);
    }
    
    /**
     * This function returns the auth object if stored in cookie
     * @returns if set in cookie -> Auth object
     * @returns if not set in cookie -> null
     */
    const getSessionCookie = (): {id: number, name: string} | null => {
        const sessionCookie = Cookies.get("session");
    
        if(sessionCookie === undefined){
            return null;
        } else {
            return JSON.parse(sessionCookie)
        }
    }

    /**
     * Deletes the cookie auth state and sets the authstate to null
     */
    const logout = (): void => {
        Cookies.remove("session");
        setauth(null);
    }

    //Getting the auth state at first initialization
    const cookie = getSessionCookie();

    let tempAuth: authProfile | null = null; 

    if(cookie) {
        tempAuth = cookie;
        console.log("seting auth")
    }

    const [auth, setauth] = useState< authProfile| null>(tempAuth);

    return (
        <AuthContext.Provider value={{auth, setauth, login, logout}}>
            {props.children}
        </AuthContext.Provider>
    );
}
 
export default AuthContextProvider;