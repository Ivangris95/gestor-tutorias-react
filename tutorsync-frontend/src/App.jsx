import { useState } from "react";
import "./App.css";
import Home from "./components/Home";
import Login from "./components/Auth/Login";

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const handleLoginSuccess = () => {
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
    };

    return (
        <>
            {!isAuthenticated && <Login onLoginSuccess={handleLoginSuccess} />}

            {isAuthenticated && <Home onLogout={handleLogout} />}
        </>
    );
}

export default App;
