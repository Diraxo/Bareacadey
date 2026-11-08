import { Button, Grid } from "@mui/material";
import React, { useState, useEffect } from "react";
import { CheckboxOverlay, ColorPickerOverlay, RadioOverlay, SelectOverlay } from "../../../utils/CrudComponents/InputsOverlay";
import { useSettings } from "../../../../MuiTheme/hooks/useSettings";
import { useTheme } from "@mui/material/styles";
import { BsCheck } from "react-icons/bs";
import { useDispatch, useSelector } from "react-redux";
import { setCurrency, setDefaultCountryCode } from "../../../../app/slices/commonSlice";
import { countries } from "../../../utils/countries";
import Loader from "../../../utils/Loader";
const GeneralSettings = () => {
  const { settings, saveSettings } = useSettings();
  const theme = useTheme();
  const dispatch = useDispatch();
  const currency = useSelector(state=>state.common.currency);
  const countryCode = useSelector(state=>state.common.defaultCountrycode);
  const handleModeChange = (mode) => {
    saveSettings({ ...settings, mode });
  };
  // themeColor
  const themeColors = [
    "info",
    "success",
    "secondary",
    "error",
    "warning",
    "purple",
  ];

  const sideBarColors = [
    "#1c2536",
    "#091c22",
    "#263645",
    "#1a1131",
    "#08200d",
    "#272727"
  ]

  const cntries = countries.map((country)=>({name: country.name+" (+"+country?.callingCodes[0]+")", value: "+"+country.callingCodes[0]}));
  
  const [loading, setLoading ] = useState(true)

  useEffect(()=>{
    setLoading(false)
  },[])

  const systemFonts = [
    { name: "Ubuntu", value: '"Ubuntu", sans-serif' },          
    { name: "Comic Sans MS", value: '"Comic Sans MS", sans-serif' }, 
    { name: "Arial", value: 'Arial, sans-serif' },              
    { name: "Segoe Script", value: '"Segoe Script", cursive' },
    { name: "Helvetica", value: 'Helvetica, sans-serif' },      
    { name: "Verdana", value: 'Verdana, sans-serif' },          
    { name: "Tahoma", value: 'Tahoma, sans-serif' },            
    { name: "Trebuchet MS", value: '"Trebuchet MS", sans-serif' }, 
    { name: "Times New Roman", value: '"Times New Roman", serif' }, 
    { name: "Georgia", value: 'Georgia, serif' },               
    { name: "Courier New", value: '"Courier New", monospace' }, 
    { name: "Palatino", value: 'Palatino, serif' },             
    { name: "Gill Sans", value: '"Gill Sans", sans-serif' },    
    { name: "Lucida Sans", value: '"Lucida Sans", sans-serif' }, 

    { name: "Helvetica Neue", value: '"Helvetica Neue", sans-serif' },
    { name: "Segoe UI", value: '"Segoe UI", sans-serif' },         
    
    
  ];

  return loading ? <Loader /> : (
    <Grid container spacing={5} sx={{ margin: 5 }}>
      <Grid item xs={12}>
        <div style={{ fontSize: 20, marginBottom: 15 }}>General Settings</div>
      </Grid>
      <Grid item xs={12} sx={{mt: 2}}>
        <SelectOverlay
          sx={{maxWidth: 300, mt: 2}}
          label={<span style={{ fontSize: 15 }}>Select Font</span>}

          required={false}
          value={settings?.font}
          // options={[
          //   {
          //     name: "Ubuntu",
          //     value: '"Ubuntu", sans-serif'
          //   },
          //   // {
          //   //   name: "Open Sans",
          //   //   value: '"Open Sans", sans-serif'
          //   // },
          //   // {
          //   //   name: "Lato",
          //   //   value: '"Lato", sans-serif'
          //   // },
          //   // {
          //   //   name: "Roboto",
          //   //   value: '"Roboto", sans-serif'
          //   // },
          //   // {
          //   //   name: "Oswald",
          //   //   value: "'Oswald', sans-serif"
          //   // }
          // ]}
          options={systemFonts}
          nameLabel="name"
          valueLabel="value"
          onChange={(e)=>{
            saveSettings({...settings, font: e.target.value})
          }}
        />
      </Grid>
      {/* <Grid item xs={12} sx={{mt: 2}}>
        <SelectOverlay
          sx={{maxWidth: 300, mt: 2}}
          label={<span style={{ fontSize: 15 }}>Select Default Currency</span>}
          required={false}
          value={currency}
          options={[
            {
              name: "United States Dollar",
              value: 'USD'
            },
            {
              name: "Ethiopian Birr",
              value: "ETB"
            },
            {
              name: "EURO",
              value: "EUR"
            },
            {
              name: "British Pound",
              value: "GBP"
            },
            {
              name: "Australian Dollar",
              value: "AUD"
            },
            {
              name: "Canadian Dollar",
              value: "CAD"
            },
            {
              name: "New Zealand Dollar",
              value: "NZD"
            },
            {
              name: "Japanese Yen",
              value: "JPY"
            },
            {
              name: "Indian Rupee",
              value: "INR"
            },
            {
              name: "Russian Ruble",
              value: "RUB"
            },
            {
              name: "Turkish Lira",
              value: "TRY"
            },
            {
              name: "Chinese Renminbi",
              value: "RMB"
            },
            
          ]}
          nameLabel="name"
          valueLabel="value"
          onChange={(e)=>{
            dispatch(
              setCurrency(e.target.value)
            );
          }}
        />
      </Grid> */}
      <Grid item xs={12} sx={{mt: 2}}>
        <SelectOverlay
          sx={{maxWidth: 300, mt: 2}}
          label={<span style={{ fontSize: 15 }}>Select Default Country Code</span>}
          required={false}
          value={countryCode}
          options={cntries}
          nameLabel="name"
          valueLabel="value"
          onChange={(e)=>{
            dispatch(
              setDefaultCountryCode(e.target.value)
            );
          }}
        />
      </Grid>
      <Grid item xs={12}>
        <div style={{ fontSize: 20, marginBottom: 15 }}>Theme Settings</div>
      </Grid>
      <Grid item xs={12}>
        <RadioOverlay
          label={<span style={{ fontSize: 18 }}>Mode</span>}
          value={settings.mode}
          onChange={(e) => {
            handleModeChange(e.target.value);
          }}
          fullWidth={true}
          options={[
            { value: "dark", label: "Dark" },
            { value: "light", label: "Light" },
          ]}
          row={true}
          nameLabel="label"
          valueLabel="value"
        />
      </Grid>
      <Grid item xs={12}>
        <div style={{ fontSize: 18, marginBottom: 20 }}>Primary Color</div>
        <div className="flex justify-start gap-4">
          {themeColors?.map((thColor, index) => {
            return (
              <div
                key={index}
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor: theme.palette[thColor]?.main,
                  borderRadius: 5,
                }}
                onClick={() => {
                  saveSettings({ ...settings, themeColor: thColor });
                  // document.documentElement.style.setProperty(
                  //   "--primary-color",
                  //   theme.palette.primary.dark
                  // );
                }}
                className="hover: cursor-pointer"
              >
                <div className="flex items-center justify-center h-full text-white">
                  {settings?.themeColor == thColor && <BsCheck size={26} />}
                </div>
              </div>
            );
          })}
        </div>
      </Grid>

      {/** navigation menu */}
      <Grid item xs={12} sx={{mt: 2}}>
      <div style={{ fontSize: 18, marginBottom: 15, marginTop: 10 }}>Navigation Menu</div>
        <SelectOverlay
          sx={{maxWidth: 300, mt: 2}}
          label={<span style={{ fontSize: 15 }}>Position</span>}
          required={false}
          value={settings?.menuMode}
          options={[{name: "Top", value: 'top'}, {name: 'Side', value: 'side'}]}
          nameLabel="name"
          valueLabel="value"
          onChange={(e)=>{
            saveSettings({...settings, menuMode: e.target.value })
          }}
        />
      </Grid>

      {settings?.menuMode == "top" &&
       <Grid item xs={12}>
         <div className="pl-4 border-l-2">
            <SelectOverlay
              sx={{maxWidth: 300, mt: 2}}
              label={<span style={{ fontSize: 15 }}>View Mode</span>}
              required={false}
              value={settings?.headerViewMode}
              options={[{name: "Default", value: 'default'}, {name: 'Boxed', value: 'boxed'}]}
              nameLabel="name"
              valueLabel="value"
              onChange={(e)=>{
                saveSettings({...settings, headerViewMode: e.target.value})
              }}
            />
            <SelectOverlay
              sx={{maxWidth: 300, mt: 2}}
              label={<span style={{ fontSize: 15 }}>Overflow</span>}
              required={false}
              value={settings?.headerOverflow}
              options={[{name: "Scroll", value: 'scroll'}, {name: 'Wrap', value: 'wrap'}]}
              nameLabel="name"
              valueLabel="value"
              onChange={(e)=>{
                saveSettings({...settings, headerOverflow: e.target.value})
              }}
            />
            <CheckboxOverlay 
               value={settings?.headerBorderLeft}
               labelText="Side Border"
               onChange={(e)=>{
                saveSettings({...settings, headerBorderLeft: e.target.checked})
              }}
            />
         </div>
       </Grid>
       
      }
      {
        settings?.menuMode == "top" && 
        <div className="m-3">
        <CheckboxOverlay 
            labelText={<span style={{fontSize: 15}}>Enable SemiDark</span>}
            value={settings?.semiDark??false}
            onChange={(e)=>{
              const value = e.target.checked;
              saveSettings({...settings, semiDark: value})
            }}
            sx={{
              mb: 4,
              maxWidth: 200
            }}
          />
          <Grid container spacing={4} alignItems="center">
            <Grid item>
              <ColorPickerOverlay
                label={<span style={{fontSize: 15}}>Change Semidark Color</span>}
                value={settings?.sideBarColor}
                sx={{minWidth: 200, pt: 1}}
                onChange={(e)=>{
                  saveSettings({...settings, sideBarColor: e})
                }}
              />  
            </Grid>
            <Grid item>
                <Button
                  variant="contained"
                  size="large"
                  sx={{mt: 2}}
                  onClick={()=>{
                    saveSettings({...settings, sideBarColor: "#1c2536"})
                  }}
                >Reset
                </Button>
            </Grid>
            <Grid item>
                <div className="flex justify-start gap-4">
                  {sideBarColors?.map((sideBarColor, index) => {
                    return (
                      <div
                        key={index}
                        style={{
                          width: 35,
                          height: 35,
                          backgroundColor: sideBarColor,
                          borderRadius: 5,
                        }}
                        onClick={() => {
                          saveSettings({ ...settings, sideBarColor: sideBarColor });
                          // document.documentElement.style.setProperty(
                          //   "--primary-color",
                          //   theme.palette.primary.dark
                          // );
                        }}
                        className="hover: cursor-pointer"
                      >
                        <div className="flex items-center justify-center h-full text-white">
                          {settings?.sideBarColor == sideBarColor && <BsCheck size={24} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
            </Grid>

          </Grid>

          <CheckboxOverlay 
            labelText={<span style={{fontSize: 15}}>Apply On Header</span>}
            value={settings?.semiDarkAffectHeaders??false}
            onChange={(e)=>{
              const value = e.target.checked;
              saveSettings({...settings, semiDarkAffectHeaders: value})
            }}
            sx={{
              mb: 4,
              maxWidth: 200
            }}
          />

        </div>
      }
      {settings?.menuMode == "side" &&
        <Grid item xs={12} sx={{mt: 6}}>
          <div style={{ fontSize: 18, marginBottom: 15 }}>Side Bar</div>
          <CheckboxOverlay 
            labelText={<span style={{fontSize: 15}}>Enable SemiDark</span>}
            value={settings?.semiDark??false}
            onChange={(e)=>{
              const value = e.target.checked;
              saveSettings({...settings, semiDark: value})
            }}
            sx={{
              mb: 4,
              maxWidth: 200
            }}
          />
          <Grid container spacing={4} alignItems="center">
            <Grid item>
              <ColorPickerOverlay
                label={<span style={{fontSize: 15}}>Change Sidebar Color</span>}
                value={settings?.sideBarColor}
                sx={{minWidth: 200, pt: 1}}
                onChange={(e)=>{
                  saveSettings({...settings, sideBarColor: e})
                }}
              />  
            </Grid>
            <Grid item>
                <Button
                  variant="contained"
                  size="large"
                  sx={{mt: 2}}
                  onClick={()=>{
                    saveSettings({...settings, sideBarColor: "#1c2536"})
                  }}
                >Reset
                </Button>
            </Grid>
            <Grid item>
                <div className="flex justify-start gap-4">
                  {sideBarColors?.map((sideBarColor, index) => {
                    return (
                      <div
                        key={index}
                        style={{
                          width: 35,
                          height: 35,
                          backgroundColor: sideBarColor,
                          borderRadius: 5,
                        }}
                        onClick={() => {
                          saveSettings({ ...settings, sideBarColor: sideBarColor });
                          // document.documentElement.style.setProperty(
                          //   "--primary-color",
                          //   theme.palette.primary.dark
                          // );
                        }}
                        className="hover: cursor-pointer"
                      >
                        <div className="flex items-center justify-center h-full text-white">
                          {settings?.sideBarColor == sideBarColor && <BsCheck size={24} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
            </Grid>
            <CheckboxOverlay 
              labelText={<span style={{fontSize: 15}}>Apply On Header</span>}
              value={settings?.semiDarkAffectHeaders??false}
              onChange={(e)=>{
                const value = e.target.checked;
                saveSettings({...settings, semiDarkAffectHeaders: value})
              }}
              sx={{
                mb: 4,
                ml: 1,
                maxWidth: 200
              }}
            />

          </Grid>

          <div className="mt-3">
            <span style={{fontSize: 18}}>Highlight Style</span>
            <div className="flex gap-10 mt-3">
              <div style={{backgroundColor: theme.palette.primary.main, width: 200, height: 40, borderRadius: "5px 30px 30px 5px"}} className="hover:cursor-pointer" onClick={(e)=>saveSettings({...settings, activeStyle: 0})}>
                <div className="flex items-center justify-center h-full text-white">
                  {settings?.activeStyle == 0 && <BsCheck size={27} />}
                </div>
              </div>
              <div style={{backgroundColor: theme.palette.primary.main, width: 200, height: 40, borderRadius: "5px 5px 5px 5px"}} className="hover:cursor-pointer" onClick={(e)=>saveSettings({...settings, activeStyle: 1})}>
                <div className="flex items-center justify-center h-full text-white">
                  {settings?.activeStyle == 1 && <BsCheck size={27} />}
                </div>
              </div>
            </div>
          </div>
          
        </Grid>  
      }
      <Grid item></Grid>
      
      
    </Grid>
  );
};

export default GeneralSettings;
