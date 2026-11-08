import React, { useEffect, useState } from 'react'
import { CurrencyOverlay } from '../../../utils/CrudComponents/InputsOverlay'
import { ButtonOverlay } from '../../../utils/CrudComponents/ComponentsOverlay';
import { MdSave } from 'react-icons/md';
import { useGetCurrencyQuery, useUpdateCurrencyMutation } from '../../../../features/auth/publicApiSlice';
import { useMediaQuery } from '@mui/material';
import {useTheme} from "@mui/material/styles";
import { useDispatch } from 'react-redux';
import { setAlert } from '../../../../app/slices/commonSlice';

const Currency = () => {
  const theme = useTheme()
  const dispatch = useDispatch()
  const sm = useMediaQuery(theme.breakpoints.down('sm'))
  const [value, setValue] = useState(0);
  const [updateCurrency, {isLoading: updateLoading}] = useUpdateCurrencyMutation()
  const {data} = useGetCurrencyQuery(null, {
    refetchOnMountOrArgChange: 30
  })

  useEffect(()=>{
    if(data?.amount) {
        setValue(data?.amount)
    }
  },[data?.amount])

  const submitForm = async () => {
    const submitData = {
        amount: value
    }
    const data = await updateCurrency(submitData).unwrap();
    if(data.message==="Successfully Updated") {
      dispatch(setAlert(
        {
          openAlert: true,
          severity: "success",
          message: data?.message,
          autoHideDuration: 5000,
          vertical: "top",
          horizontal: "right",
        }
      ));
    }
    else if(data?.error) {
      dispatch(setAlert(
        {
          openAlert: true,
          severity: "error",
          message: data?.message,
          autoHideDuration: 5000,
          vertical: "top",
          horizontal: "right"
        }
      ));
    }
  }

  return (
    <div className={`min-h-screen ${!sm ? 'p-4 m-4' : ''}`}>
     <div className='card rounded border'>
      <p className='text-2xl font-bold mb-7'>Currency Exchange</p>
      <div className='mt-4 flex items-center gap-3'>
        <label className='truncate text-lg' style={{minWidth: 120}}>1 USD To ETB</label>
        <CurrencyOverlay
            value={value}
            setValue={setValue}
            sx={{
                maxWidth: 200
            }}
            // height={45}
            required={false}
            mui={true}
            variant='outlined'
            size='small'
        />
      </div>
      <div className='mt-6'>
        <ButtonOverlay
            text='Save'
            size='medium'
            loading={updateLoading}
            onClick={()=>{
                submitForm()
            }}
            sx={{
                minWidth: 120
            }}
            startIcon={<MdSave />}
        />
      </div>
      </div>
    </div>
  )
}

export default Currency
