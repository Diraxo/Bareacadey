import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { setAlert } from '../../../../app/slices/commonSlice';
import { useAddPaymentMutation, useCheckPaymentMutation } from '../../../../features/main/paymentsApiSlice';
import ChapaIcon from "./chapa_logo.png";
import { ButtonOverlay } from '../../../utils/CrudComponents/ComponentsOverlay';
import { MdCheckCircle, MdOutlineAddLink, MdPayment } from 'react-icons/md';
import { dotSpinner } from "ldrs";
import { RadioOverlay } from '../../../utils/CrudComponents/InputsOverlay';
import { getCoursePrice } from '../../../utils/coursePrice';


dotSpinner.register()

const PaymentModal = ({ chapter, course, handleClose, refetch }) => {
    /* hooks */
    const theme = useTheme();
    const dispatch = useDispatch();

    const [paymentLink, setPaymentLink] = useState({ id: null, link: "", course: false, checking: false })

    const user = useSelector(state => state?.auth?.user)
    /* formData variables */
    const [addFormData, setAddFormData] = useState({
        phone_number: { value: user?.phone?.split("-")[1] ?? "", error: "", countryCode: user?.phone?.split("-")[0] ?? "+251" },
        currency: { value: "ETB", error: "" }
    });
    let amount = 0;

    if (course) {
    amount = getCoursePrice(course);
    } else if (chapter) {
        amount = chapter.price;
    }

    const usdToBirr = course ? course.usdToBirr : chapter?.usdToBirr;
    const amountUsd = Math.max(amount / usdToBirr, 1);
    //rtk query
    const [addPayment, { isLoading }] = useAddPaymentMutation()
    const [checkPayment, { isLoading: paymentCheckLoading }] = useCheckPaymentMutation()

    const checkPaymentStatus = async () => {
        const submitData = {}
        if (course) {
            submitData.course_id = course?.id
        } else if (chapter) {
            submitData.chapter_id = chapter?.id
        }
        const data = await checkPayment(submitData).unwrap()
        if (data.message === "Payment Was Successful") {
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
            if (refetch) {
                refetch()
            }
            if (handleClose) {
                handleClose()
            }
        }
        else if (data?.error) {
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
    const submitForm = async () => {
        const submitData = {
            _phone_number: addFormData?.phone_number?.countryCode + "-" + addFormData?.phone_number?.value,
            _amount: amount,
            _amountUsd: amountUsd,
            _currency: addFormData?.currency?.value || "ETB",
            _user_id: user?.id,
        };
        if (course) {
            submitData._course_id = course?.id
        } else if (chapter) {
            submitData._chapter_id = chapter?.id
        }
        const data = await addPayment(submitData).unwrap();
        if (data?.status == "success") {
            setPaymentLink({
                id: (submitData._course_id || submitData._chapter_id),
                link: data?.data?.checkout_url,
                course: course ? true : false,
                checking: false
            })
        } else if (data?.status == "failed") {
            if (data?.message?.amount[0] == "validation.min.numeric") {
                dispatch(setAlert(
                    {
                        openAlert: true,
                        severity: "error",
                        message: "Minimum amount should be 1$",
                        autoHideDuration: 5000,
                        vertical: "top",
                        horizontal: "right"
                    }
                ));
            } else {
                dispatch(setAlert(
                    {
                        openAlert: true,
                        severity: "error",
                        message: "Something went wrong",
                        autoHideDuration: 5000,
                        vertical: "top",
                        horizontal: "right"
                    }
                ));
            }
        }

        if (data?.message == "Payment successful" && data?.checkout_url) {
            const newWindow = window.open(data?.checkout_url, '_blank', 'noopener,noreferrer');
            if (newWindow) newWindow.opener = null;

        }
    }


    return (
        <div style={{ minWidth: 300 }} className='flex flex-col items-center relative'>
            <div className='flex justify-center bg-[#0d1c33] w-full rounded'>
                <img src={ChapaIcon} style={{ width: 110 }} className='py-6' />
            </div>
            <div className='-mt-4 px-4 mb-4 w-1/2 flex justify-center items-center shadow-2 bg-white py-3 border rounded-md font-bold text-xl truncate'>
                {`${new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'ETB',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                }).format(amount ?? 0)} / ${new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                }).format(amountUsd ?? 0)}`}
            </div>
            {!paymentLink?.link &&
                <RadioOverlay
                    formData={addFormData}
                    setFormData={setAddFormData}
                    name='currency'
                    label='Pay With'
                    options={[{ name: "ETB", value: "ETB" }, { name: "USD", value: "USD" }]}
                    nameLabel='name'
                    valueLabel='value'
                    row={true}
                />}
            {paymentCheckLoading &&
                <div>
                    <l-dot-spinner
                        size="40"
                        speed="0.9"
                        color={theme?.palette?.primary?.main}
                    ></l-dot-spinner>
                </div>}
           
            {!paymentLink?.link &&
                <ButtonOverlay
                    text='Generate Payment Link'
                    loading={isLoading}
                    fullWidth
                    sx={{
                        height: 40,
                        fontWeight: 'bold',
                        fontSize: 14,
                        marginTop: 5
                    }}
                    onClick={() => {
                        submitForm();
                    }}
                    startIcon={<MdOutlineAddLink size={26} style={{ marginRight: 5, marginBottom: -0.2 }} />}
                />}
            {paymentLink?.link && !paymentCheckLoading &&
                <ButtonOverlay
                    text='Checkout'
                    fullWidth
                    sx={{
                        height: 40,
                        fontWeight: 'bold',
                        fontSize: 14,
                        marginTop: 5
                    }}
                    onClick={() => {
                        window.open(paymentLink?.link, '_blank')
                    }}
                    startIcon={<MdPayment style={{ marginRight: 5, marginBottom: -0.2 }} />}
                />}
            {paymentLink?.link &&
                <ButtonOverlay
                    text='Check Payment'
                    loading={paymentCheckLoading}
                    fullWidth
                    sx={{
                        height: 40,
                        fontWeight: 'bold',
                        fontSize: 14,
                        marginTop: 5
                    }}
                    onClick={() => {
                        checkPaymentStatus()
                    }}
                    startIcon={<MdCheckCircle style={{ marginRight: 5, marginBottom: -0.2 }} />}
                />}
           
        </div>
    )
}

export default PaymentModal;