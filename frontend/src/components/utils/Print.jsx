import React, { useImperativeHandle, useRef } from "react";
import { useReactToPrint } from 'react-to-print';
import "./print.css"

export const Print = React.forwardRef(({component, className}, ref) => {
    const componentRef = useRef();
    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
    });
   
    useImperativeHandle(ref, () => ({
        handlePrint,
      }));
    return (
        <div ref={componentRef} className={`print-component ${className}`}>
            {component}
        </div>
    );
  })
