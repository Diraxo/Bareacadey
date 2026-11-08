import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import { RiArrowRightSLine } from 'react-icons/ri';
import Chip from "@mui/material/Chip";
import { emphasize, styled } from "@mui/material/styles";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";
import { HiHome } from "react-icons/hi";
import { useTheme } from '@mui/material/styles';

const StyledBreadcrumb = styled(Chip)(({ theme }) => {
    const backgroundColor =
      theme.palette.mode === "light" ? "#fff" : "#171B24"
        // ? theme.palette.grey[100]
        // : theme.palette.grey[800];
  
    return {
      backgroundColor,
      height: theme.spacing(6),
      color: theme.palette.text.primary,
      fontWeight: theme.typography.fontWeightRegular,
      fontSize: 16,
      
      "&:hover, &:focus": {
        backgroundColor: emphasize(backgroundColor, 0.03)
      },
      "&:active": {
        boxShadow: theme.shadows[1],
        backgroundColor: emphasize(backgroundColor, 0.12),
      },
    };
  }); 

function AppBreadcrumb({enableClickActive=true}) {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const navigate = useNavigate();

  function handleClick(event) {
    event.preventDefault();
    const anchor = event.target.closest('a');
    if(anchor) {
        const href = anchor.getAttribute('href');
        navigate(href)
    }
  }

  const theme = useTheme();

  function capitalizeWords(str) {
    let words = str.split(" ");
    for (let i = 0; i < words.length; i++) {
      let firstLetter = words[i].charAt(0).toUpperCase();
      let restOfWord = words[i].slice(1).toLowerCase();
      words[i] = firstLetter + restOfWord;
    }
    return words.join(" ");
  }

  return (
    <div className="col-12 border-1 rounded-lg p-3  dark:border-gray-700">
    <div role="presentation" onClick={handleClick}>
      <Breadcrumbs 
        aria-label="breadcrumb group"
        separator={<MdOutlineKeyboardArrowRight size={22} style={{marginTop: 4}}/>}
      >
        {/* <Breadcrumbs separator={<RiArrowRightSLine />} aria-label="breadcrumb"> */}
        <StyledBreadcrumb
          component="a"
          href="/admin/main"
          label="Home"
          icon={<HiHome size={20} />}
          className="hover:cursor-pointer"
        />
        {pathnames.map((name, index) => {
            if(name === "admin" || name==="main" || name=="l")
             return;
            const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
            const isLast = index === pathnames.length - 1;
            return isLast ? (
            // <Link key={name} color="text.primary" href={routeTo} aria-current="page">
            //     {name}
            // </Link>
               <StyledBreadcrumb
                    key={name+"-"+index}
                    component={enableClickActive ? "a" : "span"}
                    href={routeTo}
                    label={capitalizeWords(name?.split('_').join(' '))}
                    style={{
                        height: 18,
                        paddingBottom: 1,
                        color: theme.palette.primary.light
                    }}
                    className="hover:cursor-pointer"
                />
            ) : (
                <StyledBreadcrumb
                    key={name+"-"+index}
                    component="a"
                    href={routeTo}
                    label={capitalizeWords(name?.split('_').join(' '))}
                    style={{
                        height: 18,
                        paddingBottom: 1
                    }}
                    className="hover:cursor-pointer"

                />
            // <Link key={name} color="inherit" href={routeTo}>
            //     {name}
            // </Link>
            );
        })}
        </Breadcrumbs>
    </div>
    </div>
  );
}

export default AppBreadcrumb;
