import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom';
import Loader from '../../../utils/Loader';
import { Avatar, Box, Button, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ChapterItems from './ChapterItems';
import { useGetPublicCourseQuery } from '../../../../features/auth/publicApiSlice';
import { OverlayPanel } from 'primereact/overlaypanel';
import { BsPatchCheckFill } from 'react-icons/bs';
import { TabOverlay } from '../../../utils/CrudComponents/ComponentsOverlay';
import useMediaQuery from '@mui/material/useMediaQuery';
import BookItems from './BookItems';
import DocumentViewer from '../../../utils/DocumentViewer';
import RatingsAndReviews from './RatingsAndReviews';
import VideoPlayer from './VideoPlayer';
import LoginPageModal from '../../../login/LoginModal';
import CourseReviewDialog from './CourseReviewDialog';
import { markFinished, isCourseFinished, reviewAsked, setReviewAsked } from '../../../../utils/courseProgress';

const ChaptersList = () => {
  const id = useSelector(state => state?.common?.courseId);
  const user = useSelector(state => state?.auth?.user);
  const { data: course, isLoading, refetch } = useGetPublicCourseQuery({ id: id, userId: user?.id });
  const [data, setData] = useState(null);
  const navigate = useNavigate();
  const theme = useTheme();
  // const sm = useMediaQuery(theme.breakpoints.down('sm'));
  const md = useMediaQuery(theme.breakpoints.down('md'));

  const [selectedVideo, setSelectedVideo] = useState({ name: "", path: "", chapter: {} });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!user) return;
    refetch();
  }, [user?.id])

  useEffect(() => {
    if (course) {
      if (course?.error) navigate("/")
      let updatedCourse = {
        ...course,
        createdAt: new Date(course?.createdAt),
        updatedAt: new Date(course?.updatedAt),
        thumbnail: course?.thumbnail ? JSON.parse(course?.thumbnail)?.map((item) => ({ ...item, filepath: (course?.localStorage + item?.filepath) ?? null })) : [],
        introduction_video: course?.introduction_video ? JSON.parse(course?.introduction_video)?.map((item) => ({ ...item, filepath: (course?.localStorage + item?.filepath) ?? null })) : [],
      };
      setSelectedVideo(() => ({ path: updatedCourse?.introduction_video[0]?.filepath, name: updatedCourse?.introduction_video[0]?.filename }))
      setData(() => updatedCourse)
    }
  }, [course])

  const paymentRef = useRef();
  const [reviewOpen, setReviewOpen] = useState(false);

  // a video played to the end: remember it, and once every video is done ask for a review (skippable)
  const handleVideoEnded = () => {
    if (!user?.id || !course?.id || course?.type !== "course" || !course?.course_pd) return;
    const finished = markFinished(user.id, course.id, selectedVideo?.path);
    const alreadyReviewed = course?.userRatings?.some((r) => r?.added_by == user.id);
    if (alreadyReviewed || reviewAsked(user.id, course.id)) return;
    if (isCourseFinished(course?.chapters, finished)) setReviewOpen(true);
  };

  const closeReview = () => {
    setReviewAsked(user?.id, course?.id);
    setReviewOpen(false);
  };

  return isLoading ? <Loader /> : (
    <div className='flex flex-col m-auto' style={{ maxWidth: 1600 }}>
      <OverlayPanel ref={paymentRef} showCloseIcon dismissable={false}>
      <div>
          {!user &&
            <LoginPageModal onClose={()=>paymentRef?.current?.hide()}/>
          }
        </div>
      </OverlayPanel>
      <CourseReviewDialog open={reviewOpen} onClose={closeReview} course={course} user={user} />
      <div className='flex items-start flex-wrap gap-4 mt-4 mb-1 mx-4 shadow-2 p-4 rounded-md' style={{ backgroundColor: theme?.palette?.background?.paper }}>

        {!md && <Button
          variant='contained'
          onClick={() => {
            navigate(-1);
          }}
        >Back</Button>}
        <div className='flex justify-between flex-wrap gap-2 flex-1'>
          <div className='flex flex-col gap-2'>
            <p className='font-bold text-2xl'>{course?.title}</p>
            <p className='font-bold1 text-lg'>{course?.description}</p>
          </div>

          <Button
            variant='contained'
            style={{
              height: 35,
              fontSize: 14,
              fontWeight: 'bolder',
              textTransform: "capitalize",
              minWidth: 140
            }}
            className='truncate'
            color='success'
            onClick={(e) => {
              // free for everyone: signed-out visitors sign in to enroll, signed-in students are already enrolled
              if (user) return;
              paymentRef?.current?.toggle(e)
            }}
          >{user ? "Enrolled" : "Enroll Now"}</Button>

        </div>
      </div>
      <div className='flex gap-4 p-3'>
        {!md && course?.type == "course" && <div className='flex flex-col gap-3'>
          {data?.chapters?.map((chapter) => {
            return <ChapterItems key={chapter?.id} chapter={chapter} selectedVideo={selectedVideo} setSelectedVideo={setSelectedVideo} refetch={refetch}/>
          })}
        </div>}
        {!md && course?.type == "book" && <div className='flex flex-col gap-3'>
          <BookItems course={data} selectedVideo={selectedVideo} setSelectedVideo={setSelectedVideo} />
        </div>}
        <div className="w-full flex flex-col gap-2 p-2 rounded-md" style={{ backgroundColor: theme?.palette?.background?.paper }}>
         
          {course?.type == "course" && <div className='border rounded'>
            <VideoPlayer filePath={selectedVideo?.path} poster={data?.thumbnail?.[0]?.filepath} onEnded={handleVideoEnded}/>
          </div>}
          {course?.type == "book" && <div className='border rounded'>
            {selectedVideo?.name && <DocumentViewer minPdfWidth={'100%'} index={selectedVideo?.index || 0} docs={data?.pdf_files?.map((fl) => ({ uri: fl?.filepath, fileName: fl?.filename, fileType: fl?.mimetype?.split("/").pop() }))} />}
            {!selectedVideo?.name && <img src={data?.thumbnail[0]?.filepath} className='border rounded-lg'/>}
          </div>}

          <p className='font-bold p-2 text-xl border-b pb-4'>{selectedVideo?.name?.substring(0, selectedVideo?.name?.lastIndexOf('.')) || selectedVideo?.name}</p>

          <div className='border-b pb-2'>
            <Box sx={{ pt: 2, pb: 3, px: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>

                <Avatar src={course?.added_user_url ?? "/user.png"} sx={{ width: '2.5rem', height: '2.5rem' }} />
                <Box sx={{ display: 'flex', marginLeft: 3, alignItems: 'flex-start', flexDirection: 'column' }}>
                  <Typography sx={{ fontWeight: 600, fontSize: 17 }} className='flex items-center gap-2'>{course?.added_user_name}{course?.added_by == 1 && <BsPatchCheckFill color='#24a4f3' style={{ marginTop: 4 }} />}</Typography>
                </Box>
              </Box>
            </Box>
          </div>

          <TabOverlay
            card={false}
            tabs={[
              md && course?.type == "course" && {
                name: "Chapters",
                element: (
                  <div style={{ minHeight: 200 }} className='p-3'>
                    <div className='flex flex-col gap-3'>
                      {data?.chapters?.map((chapter) => {
                        return <ChapterItems key={chapter?.id} chapter={chapter} selectedVideo={selectedVideo} setSelectedVideo={setSelectedVideo} card={!md} />
                      })}
                    </div>
                  </div>
                )
              },
              md && course?.type == "book" && {
                name: "Books",
                element: (
                  <div className='flex flex-col gap-3'>
                    <BookItems course={data} selectedVideo={selectedVideo} setSelectedVideo={setSelectedVideo} card={!md} />
                  </div>
                )
              },
              {
                name: "Description",
                element: (
                  <div style={{ minHeight: 200 }} className='p-3'>
                    {selectedVideo?.chapter?.description ? selectedVideo?.chapter?.description : course?.description}
                  </div>
                )
              },
              {
                name: "Ratings",
                element: (
                  <div style={{ minHeight: 200 }}>
                    <RatingsAndReviews course={course} />
                  </div>
                )
              },

            ].filter(Boolean)}
            verticalMinWidth={220}
          />

        </div>
      </div>
    </div>
  )
}

export default ChaptersList
