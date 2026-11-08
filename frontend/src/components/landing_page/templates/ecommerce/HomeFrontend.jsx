import { Grid } from '@mui/material'
import React, { useState, useEffect } from 'react'
import { Image } from 'primereact/image';
import { Link } from 'react-router-dom';
import Rating from '@mui/material/Rating';
import HomeCorousel from './HomeCorousel';
import CoursesFrontend from './CoursesFrontend';
import Loader from '../../../utils/Loader';
import { useGetTrendingsQuery } from '../../../../features/main/trendingsApiSlice';
import { useGetPublicTrendingsQuery } from '../../../../features/auth/publicApiSlice';

const HomeFrontend = ({ style, screenSizes, search, selectedCategory, courses, coursesLoading = false }) => {

  const [detail, setDetail] = useState({ show: false, id: 0 })
  const [selectedTrend, setSelectedTrend] = useState("")

  const [trends, setTrends] = useState([])
  const [sections, setSections] = useState({ groupedSections: {}, ungroupedSections: [] })
  const [selectedSections, setSelectedSections] = useState({})

  const {
    data: trndings,
    isLoading,
    isSuccess,
    isError,
    error,
  } = useGetPublicTrendingsQuery();
  useEffect(() => {
    if (!trndings) return;
    let tnds = []
    trndings?.map((trn) => {
      const trend = { title: trn?.title, courses: [], group_under: trn?.group_under }
      trn?.Courses?.map((crs) => {
        const course = courses?.find((c) => c?.id == crs?.id);
        if (course) {
          trend.courses.push(course);
        }
      })
      tnds.push(trend);
    })
    if (tnds?.length > 0) {
      setSelectedTrend((prev) => tnds[0]?.title)
    }
    const groupedSections = tnds?.reduce((acc, item) => {
      if (item?.group_under && item.courses && item.courses.length > 0) {
        if (!acc[item?.group_under]) {
          acc[item?.group_under] = []
          setSelectedSections((prev) => ({ ...prev, [item?.group_under]: item?.title }))
        }
        acc[item?.group_under].push(item)
      }
      return acc
    }, {})
    const ungroupedSections = tnds?.filter((item) => !item?.group_under)
    setSections(() => ({ groupedSections: groupedSections, ungroupedSections: ungroupedSections }));
    setTrends(() => tnds);
  }, [trndings, courses])

  const trendingCourseIds = new Set(trends.flatMap((t) => t?.courses?.map((c) => c?.id) ?? []))
  const hasTrendingCourses = trendingCourseIds.size > 0
  const otherCourses = (courses ?? []).filter((c) => !trendingCourseIds.has(c?.id))

  return (
    <div className='flex flex-col gap-2 items-center'>
      <HomeCorousel style={style} screenSizes={screenSizes} />

      {Object.keys(sections?.groupedSections)?.map((key, indx) => {

        return (

          <div className='mt-6 flex flex-col items-center w-full' key={key + '_' + indx} >
            <div className='flex flex-col items-center'>
              <p style={{
                fontSize: 25,
                fontWeight: 500
              }}>{key}</p>

              <div className='flex gap-2 my-1'>
                <div style={{ width: 40, height: 4, backgroundColor: style?.backgroundColor }} />
                <div style={{ width: 10, height: 4, backgroundColor: style?.backgroundColor }} />
                <div style={{ width: 7, height: 4, backgroundColor: style?.backgroundColor }} />
              </div>

            </div>
            <div className='flex flex-col items-center w-full'>
              <div style={{ maxWidth: 1200 }} className="flex justify-between items-center gap-5 mt-3">
                {sections?.groupedSections[key]?.map((trend, index) => {
                  return (
                    <p
                      key={index}
                      className={`text-lg hover:cursor-pointer`}
                      style={{ fontWeight: 500, color: selectedSections[trend?.group_under] == trend?.title ? style?.backgroundColor : "rgba(0,0,0,.5)" }}
                      onClick={() => {
                        setSelectedSections((prev) => ({ ...prev, [trend?.group_under]: trend?.title }))
                      }}
                    >{trend?.title}</p>
                  )
                })}
              </div>
              <div className='w-full mt-12'>
                {isLoading && <div style={{ marginTop: -250 }}> <Loader /> </div>}
                {sections?.groupedSections[key]?.map((trend, ind) => {
                  if (trend?.title == selectedSections[trend?.group_under]) {
                    return (
                      <div key={ind}>
                        <CoursesFrontend courses={trend?.courses} style={style} screenSizes={screenSizes} search={""} selectedCategory={""} />
                      </div>
                    )
                  }
                })}

              </div>
            </div>


          </div>
        );
      })}


      {/* every published course is on the home page: the ones not placed under a Trending section are listed here */}
      {!isLoading && coursesLoading && otherCourses.length === 0 && (
        <div className='mt-6 flex flex-col items-start w-full'>
          <p style={{ fontSize: 25, fontWeight: 500 }} className='border-b w-full pb-2'>Courses</p>
          <div className='w-full mt-12'>
            <CoursesFrontend courses={[]} loading style={style} screenSizes={screenSizes} search={""} selectedCategory={""} />
          </div>
        </div>
      )}
      {!isLoading && otherCourses.length > 0 && (
        <div className='mt-6 flex flex-col items-start w-full'>
          <p style={{ fontSize: 25, fontWeight: 500 }} className='border-b w-full pb-2'>{hasTrendingCourses ? 'More Courses' : 'Courses'}</p>
          <div className='w-full mt-12'>
            <CoursesFrontend courses={otherCourses} style={style} screenSizes={screenSizes} search={""} selectedCategory={""} />
          </div>
        </div>
      )}

      {sections?.ungroupedSections?.map((section, index) => {

        return (

          <div className='mt-6 flex flex-col items-start w-full' key={index}>
            <p style={{
              fontSize: 25,
              fontWeight: 500
            }} className='border-b w-full pb-2'>{section?.title}</p>
            <div className='flex flex-col items-center w-full'>

              <div className='w-full mt-12'>
                {isLoading && <div style={{ marginTop: -250 }}> <Loader /> </div>}
                <CoursesFrontend courses={section?.courses} loading={coursesLoading} style={style} screenSizes={screenSizes} search={""} selectedCategory={""} />

              </div>
            </div>


          </div>
        );
      })}

    </div>
  )
}

export default HomeFrontend