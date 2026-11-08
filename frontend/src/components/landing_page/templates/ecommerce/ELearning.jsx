import React from 'react'
import { useMemo } from 'react';
import MainPage from './MainPage';
import "./ecommerce.scss";
import useMediaQuery from '@mui/material/useMediaQuery';
import {useTheme} from "@mui/material/styles";
import { useGetCategoriesQuery } from '../../../../features/main/categoriesApiSlice';
import { useGetCoursesQuery } from '../../../../features/main/coursesApiSlice';
import { useGetPublicCategoriesQuery, useGetPublicCoursesQuery } from '../../../../features/auth/publicApiSlice';
import { useSelector } from 'react-redux';

const ELearningLandingPage = () => {
  const theme = useTheme()
  const style = {
    backgroundColor: "#1ea966", //"#79c650",
    secondaryBackground: '#f1f1f0',
    maxWidth: 1500
  }

  const xs = useMediaQuery(theme.breakpoints.down('xs'));
  const sm = useMediaQuery(theme.breakpoints.down('sm'));
  const md = useMediaQuery(theme.breakpoints.down('md'));
  const lg = useMediaQuery(theme.breakpoints.down('lg'));
  const xl = useMediaQuery(theme.breakpoints.down('xl'));

  const screenSizes={xs, sm, md, lg, xl};
  const user = useSelector(state=>state?.auth?.user)
  // const [courses, setCourses] = useState([]);
  // const [categories, setCategories] = useState([])

  const {
    data: courses,
    isLoading,
    isSuccess,
    isError,
    error,
    refetch,
  } = useGetPublicCoursesQuery(user?.id);
  const {data: categories} = useGetPublicCategoriesQuery();
  // Derived straight from the query result (not copied into state by an effect), so there is no render in which the
  // courses have arrived but the list is still empty - that gap is what used to flash "No result found".
  const allCourses = useMemo(() => {
    if (!courses) return [];
    const published = [];
    courses.forEach((course) => {
      if (course?.routeState != "published") return;
      published.push({
        ...course,
        createdAt: new Date(course?.createdAt),
        updatedAt: new Date(course?.updatedAt),
      });
    });
    return published;
  }, [courses]);

  // Still loading until a list has actually been received (or the request failed): never present "nothing" as the answer.
  const coursesLoading = !courses && !isError;
  const coursesError = !courses && isError;

  return (
    <div>
      {
        screenSizes?.md &&false? <div></div>
        : <MainPage style={style} screenSizes={screenSizes} categories={categories} courses={allCourses} coursesLoading={coursesLoading} coursesError={coursesError} onRetryCourses={refetch}/>
      }
    </div>
  )
}

export default ELearningLandingPage;