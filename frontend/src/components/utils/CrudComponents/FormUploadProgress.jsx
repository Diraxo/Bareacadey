import React from 'react'
import { useSelector } from 'react-redux'
import { ProgressBarOverlay } from './ComponentsOverlay'

const FormUploadProgress = () => {
  const uploadProgress = useSelector(state=>state?.common?.uploadProgress)
  return (
    <div className="card mx-2 p-3 mb-3">
        <ProgressBarOverlay
            value={uploadProgress??0}
            showValue={true}
            sx={{height: ".5rem"}}
            symbol={'%'}
        />
    </div>
  )
}

export default FormUploadProgress