import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Box from "@material-ui/core/Box";
import { makeStyles } from "@material-ui/core";
import { AccountCircle } from "@material-ui/icons";
import VpnKeyIcon from '@material-ui/icons/VpnKey';
import { useState } from "react";
import { validateEmail } from "../../Utils/authUtils";
import axios from "axios";
import { AuthContext } from "../../Context/AuthContext";
import { useContext } from "react";
import { Redirect } from "react-router-dom";

export interface LoginProps {}

const useStyles = makeStyles({
    icons: {
        color: "grey",
        fontSize: 50, 
        marginRight: '5px', 
        marginLeft: '-1.5ch'
    },
    textField: {
        width: '39ch'
    },
    errorMessage: {
        backgroundColor: "#ff005c",
        width: "335px",
        marginLeft: "15px",
        textAlign: "center",
        paddingTop: "4px",
        paddingBottom: "4px",
        color: "white",
        borderRadius: "20px"
    }
})
 
const Login: React.FunctionComponent<LoginProps> = () => {

    const classes = useStyles();

    //Form input states
    const [email, setemail] = useState('')
    const [password, setpassword] = useState('')

    //Form input error states
    const [emailError, setemailError] = useState(false)
    const [passwordError, setpasswordError] = useState(false)
    const [authError, setauthError] = useState({isError: false, message: ''});

    //Form helper message states
    const [emailHelper, setemailHelper] = useState('')
    const [passwordHelper, setpasswordHelper] = useState('')

    const {auth, login} = useContext(AuthContext);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        let isVerified = true;

        //set all error to null
        setemailError(false);
        setpasswordError(false);
        setauthError({isError: false, message: ''});
        
        //Set all helper messages to blank
        setemailHelper('');
        setpasswordHelper('');

        //Validate the Email
        if(!validateEmail(email)) {
            setemailError(true);
            isVerified = false;
        }

        //Checking password not empty
        if(password === '') {
            setpasswordError(true);
            isVerified = false;
        }

        if(isVerified) {

            axios.post(`${window.location.origin}/login`, {email,password})
                .then(res => {
                    if(res.data && res.data.error) setauthError({isError: true, message: res.data.message});
                    else login({id: res.data.data.auth.id, name: res.data.data.auth.name});
                })
                .catch(err => {
                    setauthError({isError: true, message: err.message});
                })
        }
    } 

    if(auth) return <Redirect to="/dashboard"/>
    return (
        <form onSubmit={handleSubmit} noValidate>
            <Box display="flex" justifyContent="center" marginTop={10} marginBottom={2}>
                {authError.isError  && <div className={classes.errorMessage}>{authError.message}</div>}
            </Box>
            <Box display="flex" justifyContent="center" marginTop={1} marginBottom={2}>
                <AccountCircle className={classes.icons}/>
                <TextField className={classes.textField}
                    id="Login-email"
                    label="email"
                    variant="filled"
                    value={email}
                    type='email'
                    onChange={e => setemail(e.target.value)}
                    error={emailError}
                    helperText={emailHelper}
                    required
                />
            </Box>
            <Box display="flex" justifyContent="center" marginBottom={2}>
                <VpnKeyIcon className={classes.icons}/>
                <TextField className={classes.textField}
                    id="Login-pass"
                    label="password"
                    variant="filled"
                    type='password'
                    value={password}
                    onChange={e => setpassword(e.target.value)}
                    helperText={passwordHelper}
                    error={passwordError}
                    required
                />
            </Box>
            <Box display="flex" justifyContent="center">
                <Button type="submit" color="secondary" variant="contained">Login</Button>
            </Box>
        </form>
    );
}
 
export default Login;