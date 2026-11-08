
import React, { useState } from 'react';
import { Timeline } from 'primereact/timeline';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { useTheme } from '@mui/material/styles';
import User from "/user.png"
import { Avatar, IconButton, Rating } from '@mui/material';
import { GoDotFill } from "react-icons/go";
import { BsArrowRight } from "react-icons/bs";
import { ButtonOverlay, ProgressBarOverlay } from '../CrudComponents/ComponentsOverlay';
import { useSelector } from 'react-redux';
import { MdClose, MdDelete, MdDeleteOutline, MdEdit } from 'react-icons/md';

const RecordRatings = ({ ratings = [], star = 0, ratingLabel = "rating", commentLabel = "comment", userNameLabel = "added_user_name", userImgLabel = "added_user_url", userIdLabel = "added_by", postRating=()=>{}, editRating=()=>{}, deleteRating=()=>{}, loading = false, enableRating=true }) => {
    const theme = useTheme();

    const user = useSelector(state => state?.auth?.user)
    const ratingsCount = ratings?.reduce((acc, cur) => {
        acc["rt_" + cur?.[ratingLabel]] = (acc["rt_" + cur?.[ratingLabel]] || 0) + 1;
        return acc;
    }, {})

    const ratingPercentages = Object.keys(ratingsCount)?.reduce((acc, key) => {
        acc[key] = (ratingsCount[key] / ratings?.length) * 100;
        return acc;
    }, {});

    const [loadMore, setLoadMore] = useState(false);
    const [editCommentMode, setEditCommentMode] = useState(false);
    const [addFormData, setAddFormData] = useState({
        [ratingLabel]: 0,
        [commentLabel]: ""
    })
    const [editFormData, setEditFormData] = useState({
        [ratingLabel]: 0,
        [commentLabel]: ""
    })

    const formatDate = (date) => {
        const formattedDate = `${date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })} at ${date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: 'numeric'
        })}`;
        return formattedDate;
    }

    const customizedMarker = (item) => {
        return (
            <span className="flex w-2rem h-2rem align-items-center justify-content-center text-white border-circle z-1 shadow-1" style={{ backgroundColor: item.color ?? theme?.palette?.primary?.main }}>
                {item?.[userImgLabel] && <Avatar src={item?.[userImgLabel] ?? User} />}
                {!item?.[userImgLabel] && <p className='font-bold'>{item?.[userNameLabel]?.split(" ").map((chr) => chr[0]).join("")}</p>}
            </span>
        );
    };

    const customizedContent = (item) => {
        return (
            <Card
                // style={{backgroundColor: 'transparent'}}
                title={<span className='font-normal text-2xl'>{item?.[userNameLabel]}</span>}
                subTitle={
                    <div className='flex flex-col gap-1'>
                        {item?.updatedAt ? formatDate(new Date(item?.updatedAt)) : ""}
                        <Rating
                            value={item?.[ratingLabel] || 0}
                            sx={{
                                marginTop: 0
                            }}
                            readOnly
                        />
                    </div>
                } className='mb-4 rounded'>

                <div className='flex flex-col gap-2'>
                    {item?.[commentLabel]}
                </div>
            </Card>
        );
    };

    const filteredRatings = ratings?.filter(item => (item?.[commentLabel] && (!user || (item?.[userIdLabel] != user?.id))));
    const myRating = ratings?.find(item => (user && (item?.[userIdLabel] == user?.id)));
    return (
        <div className="activity_log">
            <p className='text-3xl'>Ratings and reviews</p>
            <div className='flex gap-5 border-b'>
                <div className='flex flex-col'>
                    <div className='flex flex-col gap-1 items-center'>
                        <p style={{ fontSize: 60 }}>{star}</p>
                        <Rating
                            value={star}
                            precision={0.1}
                            readOnly
                        />
                        <p className='text-xl'>{ratings?.length}</p>
                    </div>
                </div>
                <div className='p-4 flex flex-col gap-2' style={{ width: 400 }}>
                    <div className='flex items-center gap-3'>
                        <p className='text-xl'>5</p>
                        <ProgressBarOverlay
                            value={ratingPercentages["rt_" + 5] || 0}
                            sx={{
                                height: 12
                            }}
                        />
                    </div>
                    <div className='flex items-center gap-3'>
                        <p className='text-xl'>4</p>
                        <ProgressBarOverlay
                            value={ratingPercentages["rt_" + 4] || 0}
                            sx={{
                                height: 12
                            }}
                        />
                    </div>
                    <div className='flex items-center gap-3'>
                        <p className='text-xl'>3</p>
                        <ProgressBarOverlay
                            value={ratingPercentages["rt_" + 3] || 0}
                            sx={{
                                height: 12
                            }}
                        />
                    </div>
                    <div className='flex items-center gap-3'>
                        <p className='text-xl'>2</p>
                        <ProgressBarOverlay
                            value={ratingPercentages["rt_" + 2] || 0}
                            sx={{
                                height: 12
                            }}
                        />
                    </div>
                    <div className='flex items-center gap-3'>
                        <p className='text-xl'>1</p>
                        <ProgressBarOverlay
                            value={ratingPercentages["rt_" + 1] || 0}
                            sx={{
                                height: 12
                            }}
                        />
                    </div>
                </div>
            </div>
            {filteredRatings?.length > 0 &&
                <div className='mt-4'>
                    <Timeline value={!loadMore ? filteredRatings?.slice(0, 3) : filteredRatings} align="left" className="" marker={customizedMarker} content={customizedContent} />
                    {!loadMore && filteredRatings?.length > 3 &&
                        <div className='flex w-full justify-center'>
                            <Button
                                onClick={() => {
                                    setLoadMore(true)
                                }}
                            >Load More</Button>
                        </div>}
                </div>
            }
            {
                !myRating && enableRating && user &&
                <div className='mt-2 p-2'>
                    <p className='font-bold1 text-2xl'>Give your rating</p>
                    <p className='text-lg'>Tell others what you think</p>
                    <div className='flex flex-col mt-3 gap-4'>
                        <Rating
                            size='large'
                            value={addFormData?.[ratingLabel]}
                            onChange={(e, value) => {
                                setAddFormData({ ...addFormData, [ratingLabel]: value })
                            }}
                            className='w-fit'
                        />
                        <textarea
                            className='border-2 rounded-md p-3'
                            placeholder='Enter you comment'
                            rows={5}
                            style={{ maxWidth: 400 }}
                            value={addFormData?.[commentLabel]}
                            onChange={(e) => {
                                setAddFormData({
                                    ...addFormData,
                                    [commentLabel]: e.target.value
                                })
                            }}
                        ></textarea>
                        <ButtonOverlay
                            text='Post Rating'
                            sx={{
                                maxWidth: 150
                            }}
                            onClick={() => {
                                if (addFormData?.[ratingLabel] <= 0) return;
                                postRating(addFormData)
                            }}
                            loading={loading}
                        />
                    </div>
                </div>
            }
            {
                myRating &&
                <div>
                    {!editCommentMode &&
                    <Card
                        // style={{backgroundColor: 'transparent'}}
                        title={
                        <div className='flex justify-between'>
                            <span className='font-normal text-2xl'>
                                {/* {myRating?.[userNameLabel]} */}
                                Your Review
                            </span>
                            <div className='flex'>
                            <IconButton
                              onClick={()=>{
                                setEditFormData(()=>({
                                    ...editFormData,
                                    [ratingLabel]: myRating?.[ratingLabel] || 0,
                                    [commentLabel]: myRating?.[commentLabel] || "",
                                    id: myRating?.id
                                }))
                                setEditCommentMode(()=>true)
                              }}
                            >
                              <MdEdit />
                            </IconButton>
                            <IconButton
                              onClick={()=>{
                                deleteRating(myRating?.id);
                              }}
                            >
                              <MdDeleteOutline />
                            </IconButton>
                            </div>
                        </div>
                        }
                        subTitle={
                            <div className='flex flex-col gap-1'>
                                {myRating?.updatedAt ? formatDate(new Date(myRating?.updatedAt)) : ""}
                                <Rating
                                    value={myRating?.[ratingLabel] || 0}
                                    sx={{
                                        marginTop: 0
                                    }}
                                    readOnly
                                />
                            </div>
                        } className='mb-4 rounded'>

                        <div className='flex flex-col gap-2'>
                            {myRating?.[commentLabel]}
                        </div>
                    </Card>
                    }     
                    {editCommentMode && 
                       <div className='mt-2 p-2'>
                       <p className='font-bold1 text-2xl'>Give your rating</p>
                       <p className='text-lg'>Tell others what you think</p>
                       <div className='flex flex-col mt-3 gap-4'>
                           <Rating
                               size='large'
                               value={editFormData?.[ratingLabel]}
                               onChange={(e, value) => {
                                   setEditFormData({ ...editFormData, [ratingLabel]: value })
                               }}
                               className='w-fit'
                           />
                           <textarea
                               className='border-2 rounded-md p-3'
                               placeholder='Enter you comment'
                               rows={5}
                               style={{ maxWidth: 400 }}
                               value={editFormData?.[commentLabel]}
                               onChange={(e) => {
                                   setEditFormData({
                                       ...editFormData,
                                       [commentLabel]: e.target.value
                                   })
                               }}
                           ></textarea>
                           <div className='flex gap-3'>
                           <ButtonOverlay
                               text='Save Rating'
                               sx={{
                                   maxWidth: 150
                               }}
                               onClick={() => {
                                   if (editFormData?.[ratingLabel] <= 0) return;
                                   editRating(editFormData)
                                   setEditCommentMode(false)
                               }}
                               loading={loading}
                           />
                           <ButtonOverlay
                              text='Cancel'
                              color='error'
                              onClick={()=>{
                                setEditCommentMode(false)
                              }}
                           />
                           </div>
                       </div>
                   </div>
                    }          

                </div>
            }
        </div>
    )
}

export default RecordRatings;