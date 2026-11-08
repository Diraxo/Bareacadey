import { Rating } from '@mui/material'
import React from 'react'
import { ProgressBarOverlay } from '../../../utils/CrudComponents/ComponentsOverlay'
import RecordRatings from '../../../utils/RecordLogs/RecordRatings'
import { useAddUserRatingMutation, useDeleteUserRatingMutation, useUpdateUserRatingMutation } from '../../../../features/main/userRatingsApiSlice'
import { setAlert } from '../../../../app/slices/commonSlice'
import { useDispatch, useSelector } from 'react-redux'

const RatingsAndReviews = ({ course }) => {
    const userRatings = course?.userRatings;
    const dispatch = useDispatch()
    const [addUserRating, { isLoading: addLoading }] = useAddUserRatingMutation()
    const [updateUserRating, { isLoading: updateLoading }] = useUpdateUserRatingMutation()
    const [deleteUserRating, { isLoading: deleteLoading }] = useDeleteUserRatingMutation();
    const user = useSelector(state=>state?.auth?.user)
    
    const postRating = async (submitData) => {
        const sd = Object.keys(submitData)?.reduce((acc, key)=>{
            acc[`_${key}`] = submitData[key];
            return acc;
        }, {_course_id: course?.id, _user_id: user?.id});
        const data = await addUserRating(sd).unwrap();
        if (data.message === "Successfully Created") {
            dispatch(setAlert(
                {
                    openAlert: true,
                    severity: "success",
                    message: "Thankyou for putting your review",
                    autoHideDuration: 5000,
                    vertical: "top",
                    horizontal: "right",
                }
            ));
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
    const editRating = async (submitData) => {
        const sd = Object.keys(submitData)?.reduce((acc, key)=>{
            if(key != "id") {
                acc[`_${key}`] = submitData[key];
            } else {
                acc[key] = submitData[key]
            }
            return acc;
        }, {});
        const data = await updateUserRating(sd).unwrap();
        if (data.message === "Successfully Updated") {
            dispatch(setAlert(
                {
                    openAlert: true,
                    severity: "success",
                    message: "Review Updated",
                    autoHideDuration: 5000,
                    vertical: "top",
                    horizontal: "right",
                }
            ));
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

    const deleteRating = async (id) => {
        const data = await deleteUserRating({ id }).unwrap();
          if (data.message === "Successfully Deleted") {
            dispatch(
              setAlert({
                openAlert: true,
                severity: "success",
                message: "Your Review Deleted",
                autoHideDuration: 5000,
                vertical: "top",
                horizontal: "right",
              })
            );
          } else if (data.message ?? false) {
            dispatch(
              setAlert({
                openAlert: true,
                severity: "error",
                message: data?.message,
                autoHideDuration: 5000,
                vertical: "top",
                horizontal: "right",
              })
            );
          }
    }

    return (
        <div className='p-3'>
            <RecordRatings
                ratings={userRatings}
                star={course?.rating || 0}
                postRating={postRating}
                editRating={editRating}
                deleteRating={deleteRating}
                loading={addLoading || updateLoading}
                enableRating={course?.course_pd}
            />
        </div>
    )
}

export default RatingsAndReviews
