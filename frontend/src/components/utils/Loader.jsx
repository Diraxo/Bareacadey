import PulseLoader from "react-spinners/PulseLoader";
import {useTheme} from "@mui/material/styles";

const Loader = ({color="#091c22"}) => {
  const theme = useTheme();
  return (
    <div 
      style={{
        width: '100%',
        display: 'flex',
        justifyContent:'center',
        alignContent: 'center',
        margin: "300px 10px"
      }}
    >
      <PulseLoader color={theme.palette.primary.main} />
    </div>
  );
}

export default Loader;