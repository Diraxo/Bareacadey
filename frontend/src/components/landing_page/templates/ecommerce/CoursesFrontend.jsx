import { Grid } from '@mui/material'
import React, { useState } from 'react'
import { Image } from 'primereact/image';
import { Link, useNavigate } from 'react-router-dom';
import Rating from '@mui/material/Rating';
import { useDispatch, useSelector } from 'react-redux';
import { setCourseID } from '../../../../app/slices/commonSlice';
import { FaBook } from 'react-icons/fa6';
import { ImageOverlay } from '../../../utils/CrudComponents/ComponentsOverlay';

const SkeletonCard = () => (
  <Grid item xs={12} sm={12} md={6} lg={4} xl={3} style={{ maxWidth: 340, width: '100%' }}>
    <div className='border border-gray-300 rounded-md overflow-hidden' style={{ minHeight: 320 }} aria-hidden="true">
      <div className='course-skeleton' style={{ height: 200 }} />
      <div className='p-2'>
        <div className='course-skeleton' style={{ height: 20, width: '80%', borderRadius: 4 }} />
        <div className='course-skeleton mt-3' style={{ height: 16, width: '40%', borderRadius: 4 }} />
        <div className='course-skeleton mt-3' style={{ height: 26, width: '55%', borderRadius: 6 }} />
      </div>
    </div>
  </Grid>
)

const CoursesFrontend = ({ style, courses, screenSizes, search, selectedCategory, loading = false, error = false, onRetry }) => {
  const selectedCurrency = useSelector(state => state.common.currency);
  const [detail, setDetail] = useState({ show: false, id: 0 })
  const navigate = useNavigate()
  const dispatch = useDispatch()

  return (
    <div className=''>
      <style>{`@keyframes courseSkeletonPulse{0%{opacity:.55}50%{opacity:1}100%{opacity:.55}}.course-skeleton{background:#e5e7eb;animation:courseSkeletonPulse 1.2s ease-in-out infinite}@media (prefers-reduced-motion: reduce){.course-skeleton{animation:none}}`}</style>
      <Grid container spacing={{ xs: 2, sm: 4, md: 10 }} justifyContent={{ xs: "center", sm: "start" }} role={loading ? 'status' : undefined} aria-busy={loading || undefined} aria-label={loading ? 'Loading courses' : undefined}>
        {loading && [0, 1, 2, 3, 4, 5, 6, 7].map((n) => <SkeletonCard key={n} />)}
        {
          courses?.map((course) => {
            const { id, title, thumbnail, name_target_5, Category, rating, userRatings } = course;

            let image = ""
            if (thumbnail?.length > 0) {
              image = thumbnail[0]?.filepath
            }
            if (search && !String(title).toLocaleLowerCase().includes(search.toLowerCase())) return;
            if (selectedCategory && course?.category_id !== selectedCategory) return;
            return (
              <Grid item xs={12} sm={12} md={6} lg={4} xl={3} key={course?.id} style={{ maxWidth: 340, position: 'relative' }}>
                <div className='px-3 py-1 font-bold' style={{ position: 'absolute', color: 'white', backgroundColor: style.backgroundColor, borderRadius: "5px 0 5px 0" }} >
                  Free
                </div>


                {course?.type == "book" && <div className='flex items-center gap-2 text-lg px-3 py-1 font-bold mt-10' style={{ position: 'absolute', right: 0, top: 0, color: 'white', backgroundColor: "rgba(0,0,0,.3)", borderRadius: "0 5px 0 5px" }} >
                  <FaBook size={17} /> Book
                </div>}
                <div className='flex flex-col items-start justify-between pb-0 shadow-1 border border-gray-300 rounded-md' style={{ minHeight: 320 }}>
                  <div className='flex-1 w-full'>
                    {/* <Link to={`/product/detail/${id}`}> */}
                    <div
                      onClick={() => {
                        //  setDetail({
                        //   show: true,
                        //   id: id
                        //  })
                        dispatch(
                          setCourseID(id)
                        )
                        navigate("courses/chapters")
                      }}
                      className="hover:cursor-pointer"
                    >
                      <div className="flex items-center justify-center w-full bg-gradient-to-br from-purple-400 via-pink-500 to-indigo-600">
                        <ImageOverlay
                          src={image}
                          alt=""
                          className="rounded"
                          style={{ objectFit: "cover", aspectRatio: "1080/720", height: 200 }}
                        />
                      </div>

                      {/* </Link> */}
                    </div>
                  </div>
                  <div className='p-2 w-full'>
                    {/* <Link to={`/product/detail/${id}`}> */}
                    <div
                      onClick={() => {
                        // setDetail({
                        //   show: true,
                        //   id: id
                        // })
                        dispatch(
                          setCourseID(id)
                        )
                        navigate("courses/chapters")
                      }}
                      className="hover:cursor-pointer"
                    >
                      <p className={`text-lg pr-5 font-[500] ${!screenSizes?.xl ? "product_title" : "truncate"} mt-0`}>{title}</p>
                      {/* </Link> */}
                    </div>
                    <div className="flex gap-3 items-center mt-2">
                      <Rating
                        name="rating"
                        value={parseFloat(rating) ?? 0}
                        precision={0.1}
                        className=""
                        readOnly
                      />
                      <p className="text-lg">({userRatings?.length})</p>
                    </div>
                    <p className='text-md font-bold mt-1 w-fit my-2 py-1 text-white rounded-md px-2' style={{backgroundColor: style.backgroundColor}}>{name_target_5}</p>
                  </div>
                </div>
              </Grid>
            )

          })
        }
        <div className='w-full'>
          {error && !loading && (
            <div style={{ minHeight: 200 }} className='w-full flex flex-col gap-3 justify-center items-center font-bold text-xl text-center'>
              <span>We couldn't load the courses.</span>
              {onRetry && <button type='button' onClick={() => onRetry()} className='px-4 py-2 rounded-md text-white text-base' style={{ backgroundColor: style?.backgroundColor }}>Try again</button>}
            </div>
          )}
          {!loading && !error &&
            (courses?.filter((course) => {
              if (search && !String(course?.title).toLocaleLowerCase().includes(search?.toLowerCase())) return false;
              if (selectedCategory && course?.category_id !== selectedCategory) return false;
              return true;
            })?.length <= 0) && <div style={{ minHeight: 200 }} className='w-full flex justify-center items-center font-bold text-xl'>No result found</div>
          }
        </div>
      </Grid>
    </div>
  )
}

export default CoursesFrontend