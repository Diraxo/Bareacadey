import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { hideDialog, hideSidebar, setAlert, setUploadProgress } from '../../../../app/slices/commonSlice';
import FormGenerator from '../../../utils/CrudComponents/FormGenerator';
import { useGetChapterQuery, useUpdateChapterMutation, useGetChapterUploadLimitsQuery } from '../../../../features/main/chaptersApiSlice';
import { useChapterBatchUpload } from '../../../../features/main/useChapterBatchUpload';
import { analyzeSelection, computeRemovedFiles } from '../../../../utils/chapterUpload';
import ChapterUploadPanel from './ChapterUploadPanel';
import { useNavigate } from 'react-router-dom';
import useMediaQuery from '@mui/material/useMediaQuery';
import ExistingFilesEdit from '../../../utils/CrudComponents/ExistingFilesEdit';

const EditChapter = ({ newPage = false, fullScreenFormStyle=false, doubleHistoryBack=false, viewPanel="dialog", bulk = false, parentId, courses,  }) => {
  /* hooks */
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const editId = useSelector(state=>state?.common?.editId);
  const sm = useMediaQuery(theme.breakpoints.down('sm'));
  const {data: chapter} = bulk ? {} : useGetChapterQuery(editId);
  
  /* formData variables */
  const [editFormData, setEditFormData] = useState({
    title: {value: "", error: ""},
    description: {value: "", error: ""},
    free_first_n_chapters: {value: 0, error: ""},
    chapter_files: {value: [], error: ""},
    routeState: {value: "", error: ""},
    course_parent_id: {value: parentId??"", error: ""},
  });
  
  const [serverUrl, setServerUrl] = useState({
    localStorage: {value: "", error: ""}
  })
  
  useEffect(()=>{
    if(chapter) {
      if(chapter?.localStorage) {
        setServerUrl((prev) => ({...serverUrl, localStorage: chapter?.localStorage??""}))
      }
      openedFiles.current = JSON.parse(chapter?.chapter_files)??[]
      setEditFormData({
        title: { value: chapter?.title??"", error: "" },
        description: { value: chapter?.description??"", error: "" },
        free_first_n_chapters: { value: chapter?.free_first_n_chapters??"", error: "" },
        chapter_files_existing: { value: JSON.parse(chapter?.chapter_files)??[], error: "" },
        routeState: { value: chapter?.routeState??"", error: "" },
        course_parent_id: {value: chapter?.course_parent_id??"", error: ""},
      });
    }
  }, [chapter])
  
  const handleClose = () => {
    if(newPage) {
      if(doubleHistoryBack) {
        navigate(-2);
      } else {
        navigate(-1);
      }
    } else {
      dispatch(hideDialog());
      dispatch(hideSidebar());
    }
  }
  
  //rtk query
  const [updateChapter, {isLoading}] = useUpdateChapterMutation()
  
  const { data: limits } = useGetChapterUploadLimitsQuery()
  const batch = useChapterBatchUpload()
  const openedFiles = useRef([]) // the list as it was when this form was opened
  const detailsSaved = useRef(false) // the PUT below rewrites the file list: once it succeeded only uploads are retried
  const selectedFiles = editFormData?.chapter_files?.value ?? []
  const existingCount = editFormData?.chapter_files_existing?.value?.length ?? 0
  const analysis = analyzeSelection(selectedFiles, limits ?? null, existingCount)

  const notify = (severity, message) => dispatch(setAlert({
    openAlert: true,
    severity,
    message,
    autoHideDuration: severity === "success" ? 5000 : 10000,
    vertical: "top",
    horizontal: "right",
  }));

  const finish = async (result) => {
    if (!result || result.busy) return;
    if (result.error) return notify("error", `Your changes were saved. ${result.error}`);
    const b = result.batch;
    if (b?.status === 'completed') {
      await batch.acknowledge(b.id) // the result has been seen: it is not announced again after a refresh
      notify("success", "Successfully Updated");
      handleClose();
      dispatch(setUploadProgress(0))
    } else if (b?.status === 'in_progress') {
      notify("warning", `Your changes were saved. ${b.done_files} of ${b.total_files} files are uploaded. Press "Retry failed" to continue; nothing is uploaded twice.`);
    } else {
      notify("warning", `Your changes were saved. ${b.done_files} of ${b.total_files} files uploaded, ${b.failed_files} failed. Use "Retry failed" below; the uploaded files are kept.`);
    }
  }
  const finishNoFiles = () => { notify("success", "Successfully Updated"); handleClose(); dispatch(setUploadProgress(0)) }

  const submitForm = async () => {
    if (batch.running) return;
    if (analysis.blocked) {
      notify("error", analysis.errors[0]);
      return;
    }
    try {
      if (!detailsSaved.current) {
        const submitData = {
          id: editId,
          _title: editFormData?.title?.value,
          _description: editFormData?.description?.value,
          _free_first_n_chapters: editFormData?.free_first_n_chapters?.value,
          _course_parent_id: editFormData?.course_parent_id?.value,
        };
        const fd = new FormData();
        Object.keys(submitData)?.map((sdKey)=>{
          fd.append(sdKey, submitData?.[sdKey])
        })
        fd.append('_chapter_files', JSON.stringify(editFormData?.chapter_files_existing?.value))
        // only files the person removed on this form are removed; anything uploaded since the form was opened stays
        fd.append('_removed_files', JSON.stringify(computeRemovedFiles(openedFiles.current, editFormData?.chapter_files_existing?.value)))
        // details and the kept/removed existing files are saved first; new files follow one request at a time
        const data = await updateChapter(fd).unwrap();
        if (data?.error) return notify("error", data?.message);
        if (data?.message !== "Successfully Updated") return;
        detailsSaved.current = true
        if (selectedFiles.length === 0) return finishNoFiles();
      }
      await finish(await batch.start(editId, selectedFiles));
    } catch (err) {
      notify("error", err?.data?.message ?? "Something went wrong. Please try again.");
    }
  }

  const retryUploads = async () => finish(await batch.retryFailed())

  const globalProperties = {
    mui: false,
    height: "46px",
    focusWidth: "1.7px",
    borderWidth: "1.3px",
    focusColor: theme.palette.primary.dark,
    borderColor: "#cccccc",
    borderRadius: "5px",
    variant: "outlined",
    grid: 12,
    sx: { mb: 5 },
  }
  const groups = [
    {
      id: 2,
      name: "Chapter Detail",
    },
  ];
  
  let editSchema = {
    course_parent_id: {
      type: 'select',
      label: "Select course",
      group: 2,
      options: courses,
      nameLabel: "title",
      valueLabel: "id",
      colorLabel: "color",
    },
    title: {
      type: 'text',
      label: "Title",
      placeholder: "Enter Title",
      group: 2,
      multiline: false,
      rows: 3,
      required: true,
    },
    description: {
      type: 'text',
      label: "Description",
      placeholder: "Enter Description",
      group: 2,
      multiline: true,
      rows: 5,
      required: false,
      grid: 12,
    },
    free_first_n_chapters: {
      type: 'number',
      label: "Free First n Chapters",
      placeholder: "Enter Free First n Chapters",
      group: 2,
      required: false,
    },
    chapter_files: {
      type: 'files',
      label: "Chapter Files",
      group: 2,
      required: false,
      accept: "image, video, audio, pdf, word_document, excel, power_point",
      grid: 12,
    },
    upload_panel: {
      type: 'custom',
      group: 2,
      grid: 12,
      element: <ChapterUploadPanel files={selectedFiles} existingCount={existingCount} limits={limits} batch={batch} onRetry={retryUploads} unitSaved={detailsSaved.current} />,
    },
    chapter_files_existing: {
      type: 'custom',
      group: 2,
      grid: 12,
      element: editFormData?.chapter_files_existing?.value?.length > 0 ? <ExistingFilesEdit files={editFormData?.chapter_files_existing?.value} onChange={(files)=>setEditFormData({...editFormData, chapter_files_existing: {...editFormData?.chapter_files_existing, value: files}})} localStorage={serverUrl?.localStorage??null}/> : null
    },
    submit: {
      type: "submit",
      right: true,
      onClick: submitForm,
      loading: isLoading || batch.running,
      submitType: "update",
      handleClose: ()=>handleClose(),
    },
  }
  
  if(parentId) {
    editSchema = Object.fromEntries(Object.entries(editSchema).filter(([key, value]) => key != 'course_parent_id'));
  }
  
  return (
    <div>
      <FormGenerator
        schema={editSchema}
        groups={groups}
        formData={editFormData}
        setFormData={setEditFormData}
        type="panel" //panel, border, label, no-group, horizontal-wizard, vertical-wizard
        alternativeLabel={true}
        globalProperties={globalProperties}
        isLoading={isLoading || batch.running}
        enableUploadProgress={false}
        newPage={newPage}
        fullScreenFormStyle={fullScreenFormStyle}
        bulk={bulk}
        viewPanel={viewPanel}
      />
    </div>
  )
}

export default EditChapter;