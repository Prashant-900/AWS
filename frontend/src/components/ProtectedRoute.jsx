import { Navigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import api from "../api";

const ProtectedRoute = ({ children }) => {
  const [isAuthorized, setisAuthorized] = useState(null);

  const refreshToken = useCallback(async () => {
    const refresh = localStorage.getItem(REFRESH_TOKEN);
    try {
      const res = await api.post("/api/token/refresh/", { refresh });
      if (res.status === 200) {
        localStorage.setItem(ACCESS_TOKEN, res.data.access);
        setisAuthorized(true);
        return;
      } else {
        setisAuthorized(false);
      }
    } catch (error) {
      console.log(error);
      setisAuthorized(false);
    }
  }, []);

  const auth = useCallback(async () => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (!token) {
      setisAuthorized(false);
      return;
    }
    const decoded = jwtDecode(token);
    if (Date.now() >= decoded.exp * 1000) {
      await refreshToken();
    } else {
      setisAuthorized(true);
    }
  }, [refreshToken]);

  useEffect(() => {
    auth().catch(() => setisAuthorized(false));
  }, [auth]);

  if (isAuthorized === null) {
    return <div>Loading..</div>;
  }

  return isAuthorized ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
