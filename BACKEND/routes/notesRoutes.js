import express from 'express';
import { getNotes, createNote, deleteNote, updateNote } from '../controllers/notesController.js';
import { protect } from '../middleware/authMiddleware.js'; 

const router = express.Router();

router.route('/')
  .get(protect, getNotes)
  .post(protect, createNote);

router.route('/:id')
  .delete(protect, deleteNote)
  .put(protect, updateNote);

export default router;