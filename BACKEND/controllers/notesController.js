import Note from '../models/Note.js';

// @desc    Get user notes
// @route   GET /api/notes
// @access  Private
export const getNotes = async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: Failed to fetch notes' });
  }
};

// @desc    Create a new note
// @route   POST /api/notes
// @access  Private
export const createNote = async (req, res) => {
  try {
    const { title, content, color } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Please add some content to your note' });
    }

    const note = await Note.create({
      user: req.user.id,
      title: title || 'Untitled Note',
      content,
      color
    });

    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: Failed to create note' });
  }
};

// @desc    Delete a note
// @route   DELETE /api/notes/:id
// @access  Private
export const deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    if (note.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    await note.deleteOne();
    res.status(200).json({ id: req.params.id, message: 'Note deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error: Failed to delete note' });
  }
};

// @desc    Update a note
// @route   PUT /api/notes/:id
// @access  Private
export const updateNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    
      if (note.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    const updatedNote = await Note.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updatedNote);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: Failed to update note' });
  }
};