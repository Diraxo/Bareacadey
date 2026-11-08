import { useState } from "react";

import { useLocation, useNavigate } from "react-router-dom";

import Box from "@mui/material/Box";
import CardContent from "@mui/material/CardContent";
import { styled, useTheme } from "@mui/material/styles";
import MuiCard from "@mui/material/Card";

import { useVerifyEmailMutation } from "../../features/auth/authApiSlice";
import { useEffect } from "react";

import { Button } from "@mui/material";
import { Alert, AlertTitle } from "@mui/material";

const Card = styled(MuiCard)(({ theme }) => ({
  [theme.breakpoints.up("sm")]: { width: "28rem" },
}));


const EmailVerifiedPage = () => {

  const [verifyEmail, {isLoading}] = useVerifyEmailMutation()
  const location = useLocation()

  const queryParams = new URLSearchParams(location.search);
  const resetToken = queryParams.get('token');

  const navigate = useNavigate();

  const [message, setMessage] = useState({error: false, message: ""})
  
  const validateToken = async () => {
    if(!resetToken) {
      // navigate("/auth/login")
    }

    const checkToken = await verifyEmail({token: resetToken}).unwrap()
    if(!checkToken) {
      navigate("/auth/login")
    }
    if(checkToken?.error) {
      // navigate("/auth/login")
      setMessage({error: true, message: checkToken.message})
    } else if(checkToken?.message) {
      setMessage({error: false, message: checkToken.message})
    }
  }

  useEffect(()=>{
    validateToken()
  },[])

  return (
    <Box 
      className="mt-10 flex items-center justify-center"
    >
      
      <Card sx={{ zIndex: 1, marginLeft: 5, marginRight: 5 }}>
        <CardContent>
            <div className="flex flex-col items-start justify-center p-2">
              {message.message && (
                <div className="w-96">
                  {message.error ? (
                    <Alert severity="error">
                      <AlertTitle style={{fontSize: 17}}>Error</AlertTitle>
                      <p style={{fontSize: 15}}>{message.message}</p>
                    </Alert>
                  ) : (
                    <Alert severity="success">
                      <AlertTitle style={{fontSize: 17}}>Success</AlertTitle>
                      <p style={{fontSize: 15}}>{message.message}</p>
                    </Alert>
                  )}
                </div>
              )}
              <Button
                variant="contained"
                color="primary"
                className="mt-4"
                onClick={()=>{
                  navigate("/auth/login")
                }}
              >
                {message?.error ? "Back To Login" : "Sign In"}
              </Button>
            </div>
        </CardContent>
      </Card>
    </Box>
  );
};

export default EmailVerifiedPage;
