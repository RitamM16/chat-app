import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Box from "@material-ui/core/Box";
import { makeStyles, Snackbar } from "@material-ui/core";
import { AccountCircle } from "@material-ui/icons";
import VpnKeyIcon from '@material-ui/icons/VpnKey';
import { useState } from "react";
import PersonIcon from '@material-ui/icons/Person';
import { validateEmail } from "../../Utils/authUtils";
import axios from "axios";
import { Alert } from "@material-ui/lab";

export interface SignupProps {}

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
 
const Signup: React.FunctionComponent<SignupProps> = () => {

    const classes = useStyles();

    //Form input states
    const [email, setemail] = useState('')
    const [name, setname] = useState('')
    const [password, setpassword] = useState('')
    const [confpass, setconfpass] = useState('')

    //Form input error states
    const [emailError, setemailError] = useState(false)
    const [nameError, setnameError] = useState(false)
    const [passwordError, setpasswordError] = useState(false)
    const [authError, setauthError] = useState({isError: false, message: ''});
    
    //Form input helper messages states
    const [authSuccess, setAuthSuccess] = useState(false);
    const [emailHelper, setemailHelper] = useState('')
    const [passwordHelper, setpasswordHelper] = useState('')

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {

        console.log(window.location)

        e.preventDefault();

        let isVerified = true;

        //set all error to null
        setemailError(false);
        setnameError(false);
        setpasswordError(false);
        setauthError({isError: false, message: ''});
        
        //set all helper to blank
        setemailHelper('');
        setpasswordHelper('');

        /**
         * Validate the inputs
         */
        if(!validateEmail(email)) {
            setemailError(true);
            isVerified = false;
        }
        if(name === '') {
            setnameError(true);
            isVerified = false;
        }
        if(password === '') {
            setpasswordError(true);
            isVerified = false;
        }

        //Match password with confirm password
        if(password !== confpass) {
            setpasswordError(true);
            setpasswordHelper("The passwords does not match");
            isVerified = false;
        }

        if(isVerified) {
            axios.post(`${window.location.origin}/signup`, {email,name,password})
                .then(res => {
                    if(res.data.error) setauthError({isError: true, message: res.data.message});
                    else setAuthSuccess(true)
                })
        }
    }

    return (
        <form onSubmit={handleSubmit} noValidate>
            <Snackbar open={authSuccess} autoHideDuration={6000} onClose={() => setAuthSuccess(false)}>
                <Alert onClose={() => setAuthSuccess(false)} severity="success">
                    Signup Successfull, Head to Login...
                </Alert>
            </Snackbar>
            <Box display="flex" justifyContent="center" marginTop={10} marginBottom={2}>
                {authError.isError  && <div className={classes.errorMessage}>{authError.message}</div>}
            </Box>
            <Box display="flex" justifyContent="center" marginTop={1} marginBottom={2}>
                <AccountCircle className={classes.icons}/>
                <TextField className={classes.textField}
                    id="signup-email"
                    label="email"
                    variant="filled"
                    type="email"
                    value={email}
                    onChange={e => setemail(e.target.value)}
                    error={emailError}
                    helperText={emailHelper}
                    required
                />
            </Box>
            <Box display="flex" justifyContent="center" marginTop={2} marginBottom={2}>
                <PersonIcon className={classes.icons}/>
                <TextField className={classes.textField}
                    id="signup-name"
                    label="name"
                    variant="filled"
                    type="name"
                    value={name}
                    onChange={e => setname(e.target.value)}
                    error={nameError}
                    required
                />
            </Box>
            <Box display="flex" justifyContent="center" marginBottom={2}>
                <VpnKeyIcon className={classes.icons}/>
                <TextField className={classes.textField}
                    id="signup-pass"
                    label="password"
                    variant="filled"
                    type="password"
                    value={password}
                    onChange={e => setpassword(e.target.value)}
                    helperText={passwordHelper}
                    error={passwordError}
                    required
                />
            </Box>
            <Box display="flex" justifyContent="center" marginBottom={2}>
                <VpnKeyIcon className={classes.icons}/>
                <TextField className={classes.textField}
                    id="signup-confpass"
                    label="confirm password"
                    variant="filled"
                    type="password"
                    value={confpass}
                    onChange={e => setconfpass(e.target.value)}
                    error={passwordError}
                    helperText={passwordHelper}
                    required
                />
            </Box>
            <Box display="flex" justifyContent="center">
                <Button type="submit" color="secondary" variant="contained">signup</Button>
            </Box>
        </form>
    );
}
 
export default Signup;