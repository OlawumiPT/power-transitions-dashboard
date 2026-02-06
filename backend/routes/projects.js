const express = require('express');
const router = express.Router();
const multer = require('multer');
const projectController = require('../controllers/projectController');
// const { validateProjectCreate, validateProjectUpdate } = require('../middleware/projectValidation');

// Configure multer for file upload (memory storage for Excel processing)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept Excel and CSV files
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/csv'
    ];
    const allowedExts = ['.xlsx', '.xls', '.csv'];
    const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));

    if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV file.'));
    }
  }
});

// ========== ROUTE DEFINITIONS ==========

/**
 * @route   GET /api/projects
 * @desc    Get all projects with optional filtering
 * @access  Public (for now)
 */
router.get('/', projectController.getProjects);

/**
 * @route   GET /api/projects/stats
 * @desc    Get dashboard statistics
 * @access  Public (for now)
 */
router.get('/stats', projectController.getDashboardStats);

/**
 * @route   GET /api/projects/filters
 * @desc    Get filter options for dropdowns
 * @access  Public (for now)
 */
router.get('/filters', projectController.getFilterOptions);

/**
 * @route   GET /api/projects/ma-stats
 * @desc    Get M&A pipeline statistics
 * @access  Public (for now)
 */
router.get('/ma-stats', projectController.getMaStats);

/**
 * @route   GET /api/projects/ma-custom-fields
 * @desc    List all custom M&A fields
 */
router.get('/ma-custom-fields', projectController.getCustomFields);

/**
 * @route   POST /api/projects/ma-custom-fields
 * @desc    Add a new custom field (ALTER TABLE + registry)
 */
router.post('/ma-custom-fields', projectController.addCustomField);

/**
 * @route   DELETE /api/projects/ma-custom-fields/:id
 * @desc    Remove a custom field (ALTER TABLE DROP + registry)
 */
router.delete('/ma-custom-fields/:id', projectController.removeCustomField);

/**
 * @route   POST /api/projects/import
 * @desc    Import projects from Excel with upsert capability
 * @access  Public (for now - add auth later)
 */
router.post('/import', upload.single('file'), projectController.importProjects);

/**
 * @route   GET /api/projects/:id
 * @desc    Get single project by ID
 * @access  Public (for now)
 */
router.get('/:id', projectController.getProject);

/**
 * @route   POST /api/projects
 * @desc    Create new project
 * @access  Public (for now - add auth later)
 */
router.post('/', projectController.createProject);

/**
 * @route   PUT /api/projects/:id
 * @desc    Update existing project
 * @access  Public (for now - add auth later)
 */
router.put('/:id', projectController.updateProject);

/**
 * @route   PATCH /api/projects/:id
 * @desc    Partially update project
 * @access  Public (for now - add auth later)
 */
router.patch('/:id', projectController.patchProject);

/**
 * @route   DELETE /api/projects/:id
 * @desc    Delete project (soft delete)
 * @access  Public (for now - add auth later)
 */
router.delete('/:id', projectController.deleteProject);

// ========== ROUTE DOCUMENTATION ==========

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get all projects
 *     description: Retrieve all projects with optional filtering and pagination
 *     parameters:
 *       - in: query
 *         name: iso
 *         schema:
 *           type: string
 *         description: Filter by ISO/RTO
 *       - in: query
 *         name: plant_owner
 *         schema:
 *           type: string
 *         description: Filter by plant owner
 *       - in: query
 *         name: tech
 *         schema:
 *           type: string
 *         description: Filter by technology
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 1000
 *         description: Number of projects to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of projects to skip
 *     responses:
 *       200:
 *         description: Successful operation
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Get project by ID
 *     description: Retrieve a single project by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Successful operation
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */

// Export router
module.exports = router;