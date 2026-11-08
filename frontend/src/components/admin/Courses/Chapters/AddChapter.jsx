import React,{useState, useEffect, useRef} from 'react';
import { useDispatch } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { hideDialog, hideSidebar, setAlert, setUploadProgress } from '../../../../app/slices/commonSlice';
import FormGenerator from '../../../utils/CrudComponents/FormGenerator';
import { useAddChapterMutation, useGetChapterUploadLimitsQuery } from '../../../../features/main/chaptersApiSlice';
import { useChapterBatchUpload } from '../../../../features/main/useChapterBatchUpload';
import { analyzeSelection } from '../../../../utils/chapterUpload';
import ChapterUploadPanel from './ChapterUploadPanel';
import { useNavigate } from 'react-router-dom';

const AddChapter = ({ newPage=false, fullScreenFormStyle=false, parentId, courses,  }) => {
  /* hooks */
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  /* formData variables */
  const [addFormData, setAddFormData] = useState({
    title: {value: "", error: ""},
    description: {value: "", error: ""},
    free_first_n_chapters: {value: 0, error: ""},
    chapter_files: {value: [], error: ""},
    routeState: {value: "", error: ""},
    course_parent_id: {value: parentId??"", error: ""},
  });
  
  const handleClose = () => {
    if(newPage) {
      navigate(-1);
    } else {
      dispatch(hideDialog());
      dispatch(hideSidebar());
    }
  }
  
  //rtk query
  const [addChapter, {isLoading}] = useAddChapterMutation()
  
  const { data: limits } = useGetChapterUploadLimitsQuery()
  const batch = useChapterBatchUpload()
  const createdId = useRef(null) // set once the unit exists, so a retry never creates it a second time
  const selectedFiles = addFormData?.chapter_files?.value ?? []
  const analysis = analyzeSelection(selectedFiles, limits ?? null, 0)

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
    if (result.error) return notify("error", `The unit was saved. ${result.error}`);
    const b = result.batch;
    if (b?.status === 'completed') {
      await batch.acknowledge(b.id) // the result has been seen: it is not announced again after a refresh
      notify("success", "Successfully Created");
      handleClose();
      dispatch(setUploadProgress(0))
    } else if (b?.status === 'in_progress') {
      notify("warning", `The unit was saved. ${b.done_files} of ${b.total_files} files are uploaded. Press "Retry failed" to continue; nothing is uploaded twice.`);
    } else {
      notify("warning", `The unit was saved. ${b.done_files} of ${b.total_files} files uploaded, ${b.failed_files} failed. Use "Retry failed" below; the uploaded files are kept.`);
    }
  }
  const finishNoFiles = () => { notify("success", "Successfully Created"); handleClose(); dispatch(setUploadProgress(0)) }

  const submitForm = async () => {
    if (batch.running) return;
    if (analysis.blocked) {
      notify("error", analysis.errors[0]);
      return;
    }
    try {
      if (!createdId.current) {
        const submitData = {
          _title: addFormData?.title?.value,
          _description: addFormData?.description?.value,
          _free_first_n_chapters: addFormData?.free_first_n_chapters?.value,
          _course_parent_id: addFormData?.course_parent_id?.value,
        };
        const fd = new FormData();
        Object.keys(submitData)?.map((sdKey)=>{
          fd.append(sdKey, submitData?.[sdKey])
        })
        // the unit is created first (no files); the files follow one request at a time
        const data = await addChapter(fd).unwrap();
        if (data?.error) return notify("error", data?.message);
        if (data?.message !== "Successfully Created") return;
        createdId.current = data?.id ?? null
        if (selectedFiles.length === 0) return finishNoFiles();
        if (!createdId.current) return notify("error", "The unit was created, but the server did not return its id. Open the unit and add the files from Edit.");
      }
      await finish(await batch.start(createdId.current, selectedFiles));
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
  
  let addSchema = {
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
      placeholder: 'Enter Free First n Chapters',
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
      element: <ChapterUploadPanel files={selectedFiles} limits={limits} batch={batch} onRetry={retryUploads} unitSaved={!!createdId.current} />,
    },
    submit: {
      type: "submit",
      onClick: submitForm,
      loading: isLoading || batch.running,
      right: true,
      handleClose: ()=>handleClose(),
    },
  }
  
  if(parentId) {
    addSchema = Object.fromEntries(Object.entries(addSchema).filter(([key, value]) => key != 'course_parent_id'));
  }
  
  return (
    <div>
      <FormGenerator
        schema={addSchema}
        groups={groups}
        formData={addFormData}
        setFormData={setAddFormData}
        type="panel" //panel, border, label, no-group, horizontal-wizard, vertical-wizard
        alternativeLabel={true}
        isLoading={isLoading || batch.running}
        globalProperties={globalProperties}
        newPage={newPage}
        fullScreenFormStyle={fullScreenFormStyle}
        enableUploadProgress={false}
      />
    </div>
  )
}

export default AddChapter;