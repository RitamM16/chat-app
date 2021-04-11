import { BrowserRouter as Router, Route, Switch} from "react-router-dom";
import Login from "./Components/Auth/Login";
import NavBar from "./Components/Navbar";
import Signup from "./Components/Auth/Signup";
import Dashboard from "./Components/Dashboard/Dashboard";
import ChatContextProvider from "./Context/ChatContext";
import SocketContextProvider from "./Context/SocketContext";
import CallContextProvider from "./Context/CallContext";

function App() {
  return (
    <div className="app">
      <Router> 
        <SocketContextProvider>
          <CallContextProvider>
            <ChatContextProvider>
              <NavBar/>
              <Switch>
                <Route exact path="/" component={Login}/>  
                <Route path="/login" component={Login}/>
                <Route path="/signup" component={Signup}/>
                <Route path="/dashboard" component={Dashboard}/>
              </Switch>
            </ChatContextProvider>
          </CallContextProvider>
        </SocketContextProvider>
      </Router>
    </div>
  );
}

export default App;
