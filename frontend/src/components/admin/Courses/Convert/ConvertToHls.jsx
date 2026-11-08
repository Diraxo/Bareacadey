import React, { useState } from 'react'
import { useTheme } from '@mui/material/styles';
import { useGetConvertedCoursesQuery, useConvertCourseMutation } from '../../../../features/main/coursesApiSlice';
import Loader from '../../../utils/Loader';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { Button, Collapse, LinearProgress } from '@mui/material';
import MulitValueProgresBar from '../../../utils/Graph/MultiValueProgressBar';
import { PiVideoFill } from 'react-icons/pi';
import { FcFolder } from 'react-icons/fc';
import { ButtonOverlay } from '../../../utils/CrudComponents/ComponentsOverlay';
import { setAlert } from '../../../../app/slices/commonSlice';
import { useDispatch } from 'react-redux';

const ConvertToHls = () => {
    const theme = useTheme();

    const {
        data: courses,
        isLoading,
        refetch,
        isSuccess,
        isError,
        error,
    } = useGetConvertedCoursesQuery(null, { pollingInterval: 15000 });

    

    return isLoading ? <Loader /> : (
        <div className='border w-full p-4' style={{ backgroundColor: theme.palette.background.paper, minHeight: '65vh' }}>
            <CourseList courses={courses} refetch={refetch}/>
        </div>
    )
}
const CourseList = ({ courses, refetch }) => {
    const [expandedCourse, setExpandedCourse] = useState(null);
    const [expandedChapter, setExpandedChapter] = useState(null);

    const dispatch = useDispatch();

    const toggleCourse = (index) => {
        setExpandedCourse(expandedCourse === index ? null : index);
    };

    const toggleChapter = (index) => {
        setExpandedChapter(expandedChapter === index ? null : index);
    };

    function formatBytes(bytes) {
        if (isNaN(bytes) || bytes < 0) {
            return "0 bytes";
        }
        const units = ["bytes", "KB", "MB", "GB"];
        const thresholds = [1000, 1000 ** 2, 1000 ** 3];
        for (let i = 0; i < units.length; i++) {
            if (bytes < thresholds[i] || i === units.length - 1) {
                return (bytes / (thresholds[i - 1] || 1)).toFixed(3) + " " + units[i];
            }
        }
    }

    const [updateCourse, { isLoading: updateLoading }] = useConvertCourseMutation();

    async function convertFile(filePath) {
        const fd = {filePath}
        const data = await updateCourse(fd).unwrap()
        if(data.message==="Task Started") {
            refetch();
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
        <div className="p-4">
            {courses.map((course, courseIndex) => (
                <div key={courseIndex} className="mb-4 border rounded-lg p-4 shadow-lg">
                    <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleCourse(courseIndex)}
                    >
                        <div className='flex gap-1'>
                            <img src={course.img} alt={course.title} className="mr-4 inline-block" style={{ width: 100, height: 60, borderRadius: 4, objectFit: 'cover' }} />
                            <div className='flex flex-col justify-around'>
                                <span className="text-lg font-semibold">{course.title}</span>
                                <div className='w-full'>
                                    <MulitValueProgresBar thickness={10} values={Object.entries(course?.overview)?.filter(([key, value]) => key != "notStarted")?.map(([key, value]) => (key == "completed" ? { value: value, tooltip: "Completed", color: "green" } : { value: value, tooltip: "In Progress", color: 'purple' }))} total={Object.values(course?.overview)?.reduce((acc, cur) => acc += cur)} />
                                </div>
                            </div>

                        </div>
                        <div className="flex items-center">
                            {expandedCourse === courseIndex ? <FaChevronUp /> : <FaChevronDown />}
                        </div>
                    </div>

                    <Collapse in={expandedCourse === courseIndex}>
                        <div className="mt-4">
                            {course.introduction_video.path && (
                                <div className="mb-4">
                                    <div className='flex flex-1 items-center truncate mb-2'>
                                        <FcFolder size={22} />
                                        <p className="font-bold text-lg truncate pl-2">Introduction Video</p>
                                    </div>
                                    <div className="flex items-center justify-between mt-3">
                                        <div className='flex items-center gap-2 mx-4 truncate'>
                                            <PiVideoFill size={20} color="#ff0000" />
                                            <p className="text-md truncate flex-1">{course.introduction_video.fileName}</p>
                                        </div>
                                        {course?.introduction_video?.status === 'Not Started' ? (
                                            <div className='flex items-center gap-3'>
                                                <p className="text-md truncate font-bold">{formatBytes(course?.introduction_video?.size)}</p>
                                                <ButtonOverlay text='Convert' size="small" variant="contained" color="primary" onClick={() => { convertFile(course?.introduction_video?.path) }} />
                                                   
                                            </div>
                                        ) : (
                                            <div className='flex items-center gap-3'>
                                                <p className="text-md truncate font-bold">{formatBytes(course?.introduction_video?.size)}</p>
                                                <div className={`px-2 rounded font-bold text-white`} style={{ backgroundColor: course?.introduction_video?.status == "Completed" ? "green" : "purple" }}>{course.introduction_video.status}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {course.chapters.map((chapter, chapterIndex) => (
                                <div key={chapterIndex} className="mb-4">
                                    <div
                                        className="flex items-center justify-between cursor-pointer"
                                        onClick={() => toggleChapter(chapterIndex)}
                                    >
                                        <div className='flex flex-1 items-center truncate mb-2 pb-2'>
                                            <FcFolder size={22} />
                                            <p className="font-bold text-lg truncate pl-2">{chapter.title}</p>
                                        </div>
                                        <div className='flex items-center gap-3'>
                                        <div style={{width: 100}}>
                                            <MulitValueProgresBar thickness={7} values={Object.entries(chapter?.overview)?.filter(([key, value]) => key != "notStarted")?.map(([key, value]) => (key == "completed" ? { value: value, tooltip: "Completed", color: "green" } : { value: value, tooltip: "In Progress", color: 'purple' }))} total={Object.values(chapter?.overview)?.reduce((acc, cur) => acc += cur)} />
                                       </div>
                                          {expandedChapter === chapterIndex ? <FaChevronUp size={16}/> : <FaChevronDown size={16} />}
                                        </div>
                                    </div>

                                    <Collapse in={expandedChapter === chapterIndex}>
                                        <div className="mt-2 pl-4">
                                            {chapter.files.map((file, fileIndex) => (
                                                <div key={fileIndex} className="flex items-center justify-between my-3">
                                                    <div className='flex items-center gap-2 mr-4 truncate'>
                                                        <PiVideoFill size={20} color="#ff0000" />
                                                        <p className="text-md truncate flex-1">{file.fileName}</p>
                                                    </div>
                                                    {file.status === 'Not Started' ? (
                                                        <div className='flex items-center gap-3'>
                                                            <p className="text-md truncate font-bold">{formatBytes(file.size)}</p>
                                                            <ButtonOverlay text="Convert" size="small" variant="contained" color="primary" onClick={() => convertFile(file?.path)} />
                                                                
                                                        </div>
                                                    ) : (
                                                        <div className='flex items-center gap-3'>
                                                            <p className="text-md truncate font-bold">{formatBytes(file.size)}</p>
                                                            <div className={`px-2 rounded font-bold text-white`} style={{ backgroundColor: file.status == "Completed" ? "green" : "purple" }}>{file.status}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </Collapse>
                                </div>
                            ))}
                        </div>
                    </Collapse>
                </div>
            ))}
        </div>
    );
};


export default ConvertToHls;