import { createStyles, makeStyles, Theme } from "@material-ui/core";
import Grid from "@material-ui/core/Grid";

export interface ChatBubbleProps {
    id: string,
    direction?: "left" | "right",
    message: string
}

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        bubbleParent: {
            marginTop: "2px",
            marginBottom: "2px"
        },
        rightbubble: {
            textAlign: 'center',
            color: "white",
            backgroundColor: theme.palette.primary.main,
            paddingTop: "1px",
            paddingBottom: "1px",
            paddingRight: "15px",
            paddingLeft: "20px",
            minWidth: "100px",
            minHeight: "35px",
            marginLeft: "10px",
            marginRight: "10px",
            borderTopLeftRadius: "50px",
            borderBottomLeftRadius: "50px",
            borderBottomRightRadius: "20px",
            maxWidth: "300px",
            wordWrap: "break-word",
        },
        leftBubble: {
            textAlign: 'center',
            color: "white",
            backgroundColor: theme.palette.primary.main,
            paddingTop: "1px",
            paddingBottom: "1px",
            paddingRight: "25px",
            paddingLeft: "15px",
            minWidth: "100px",
            minHeight: "35px",
            marginLeft: "10px",
            marginRight: "10px",
            borderTopRightRadius: "50px",
            borderBottomRightRadius: "50px",
            borderBottomLeftRadius: "20px",
            maxWidth: "300px",
            wordWrap: "break-word",
        }
    }),
)

const ChatBubble: React.FunctionComponent<ChatBubbleProps> = ({id, direction="left", message}) => {
    
    const classes = useStyles();
    
    return (
        <Grid id={id} item className={classes.bubbleParent}>
            <div style={{float: direction }}>
                <div className={direction === "left" ? classes.leftBubble : classes.rightbubble}>
                    <p>{message}</p>
                </div>
            </div>
        </Grid>
    );
}
 
export default ChatBubble;