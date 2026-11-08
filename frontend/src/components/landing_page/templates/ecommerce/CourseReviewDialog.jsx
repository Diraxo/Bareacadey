import React, { useState } from 'react'
import { Dialog, DialogContent, Rating, TextField, Button, Typography, Box } from '@mui/material'
import { useDispatch } from 'react-redux'
import { useAddUserRatingMutation } from '../../../../features/main/userRatingsApiSlice'
import { setAlert } from '../../../../app/slices/commonSlice'

const LABELS = { 1: 'Not for me', 2: 'Could be better', 3: 'Good', 4: 'Great', 5: 'Outstanding' }

const CourseReviewDialog = ({ open, onClose, course, user }) => {
  const dispatch = useDispatch()
  const [addUserRating, { isLoading }] = useAddUserRatingMutation()
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(-1)
  const [comment, setComment] = useState('')

  const alert = (severity, message) =>
    dispatch(setAlert({ openAlert: true, severity, message, autoHideDuration: 5000, vertical: 'top', horizontal: 'right' }))

  const submit = async () => {
    if (!rating) return alert('warning', 'Tap a star to rate the course first')
    try {
      const data = await addUserRating({ _rating: rating, _comment: comment, _course_id: course?.id, _user_id: user?.id }).unwrap()
      if (data?.error) return alert('error', data?.message)
      alert('success', 'Thank you for your review!')
      onClose()
    } catch (e) {
      alert('error', 'Could not send your review. Please try again.')
    }
  }

  const shown = hover !== -1 ? hover : rating

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}>
      <Box sx={{ background: 'linear-gradient(135deg,#0f172a 0%,#1d4ed8 100%)', color: '#fff', textAlign: 'center', px: 3, pt: 4, pb: 3 }}>
        <Typography sx={{ fontSize: 44, lineHeight: 1 }}>🏆</Typography>
        <Typography variant="h5" sx={{ fontWeight: 800, mt: 1 }}>Course complete!</Typography>
        <Typography sx={{ opacity: 0.85, mt: 0.5 }}>
          Congratulations on finishing {course?.title ? `“${course.title}”` : 'this course'}.
        </Typography>
      </Box>
      <DialogContent sx={{ textAlign: 'center', pt: 3 }}>
        <Typography sx={{ fontWeight: 600 }}>How was your experience?</Typography>
        <Typography variant="body2" sx={{ opacity: 0.7, mb: 1.5 }}>Your feedback helps other learners and our instructors.</Typography>
        <Rating
          value={rating}
          onChange={(e, v) => setRating(v || 0)}
          onChangeActive={(e, v) => setHover(v)}
          sx={{ fontSize: 44 }}
        />
        <Typography sx={{ height: 24, fontWeight: 600, color: '#d97706' }}>{LABELS[shown] || ''}</Typography>
        <TextField
          fullWidth multiline minRows={3} placeholder="Tell us more (optional)"
          value={comment} onChange={(e) => setComment(e.target.value)}
          inputProps={{ maxLength: 250 }} sx={{ mt: 1 }}
        />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2.5 }}>
          <Button variant="contained" size="large" disabled={isLoading} onClick={submit} sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 700 }}>
            {isLoading ? 'Sending…' : 'Submit review'}
          </Button>
          <Button color="inherit" onClick={onClose} sx={{ textTransform: 'none', opacity: 0.7 }}>Maybe later</Button>
        </Box>
      </DialogContent>
    </Dialog>
  )
}

export default CourseReviewDialog
