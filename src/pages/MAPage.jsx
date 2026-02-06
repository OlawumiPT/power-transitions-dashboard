import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { projectService } from '../services/projectService';
import MAKPICards from '../components/MA/MAKPICards';
import MATable from '../components/MA/MATable';
import MAAddProjectModal from '../components/MA/MAAddProjectModal';
import MACustomFieldModal from '../components/MA/MACustomFieldModal';
import MABatchActionBar from '../components/MA/MABatchActionBar';
import MAConfirmModal from '../components/MA/MAConfirmModal';
import './MAPage.css';

const MAPage = () => {
  const { token } = useAuth();

  // Data state
  const [projects, setProjects] = useState([]);
  const [maStats, setMaStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [isoOptions, setIsoOptions] = useState([]);
  const [maTierOptions, setMaTierOptions] = useState([]);

  // Custom fields
  const [customFields, setCustomFields] = useState([]);
  const [showFieldModal, setShowFieldModal] = useState(false);

  // Table controls
  const [editMode, setEditMode] = useState(false);
  const [editedRows, setEditedRows] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: 'project_name', direction: 'ASC' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(8);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');

  // Batch save state
  const [isSaving, setIsSaving] = useState(false);
  const [saveResults, setSaveResults] = useState({});
  const [batchError, setBatchError] = useState('');
  const saveTimerRef = useRef(null);

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);

  // Confirm discard modal state — stores the action to run on confirm
  const [confirmAction, setConfirmAction] = useState(null);

  const dirtyCount = Object.keys(editedRows).length;

  // beforeunload guard
  useEffect(() => {
    const handler = (e) => {
      if (editMode && Object.keys(editedRows).length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [editMode, editedRows]);

  // Cleanup save timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * pageSize;
      const result = await projectService.fetchMaProjects({
        limit: pageSize,
        offset,
        sort_by: sortConfig.key,
        sort_order: sortConfig.direction,
        search: searchDebounce || undefined
      }, token);

      setProjects(result.data || []);
      setTotalCount(result.total || result.pagination?.total || 0);
    } catch (err) {
      console.error('Failed to fetch M&A projects:', err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, pageSize, sortConfig, searchDebounce]);

  const fetchStats = useCallback(async () => {
    try {
      const stats = await projectService.fetchMaStats(token);
      setMaStats(stats);
    } catch (err) {
      console.error('Failed to fetch M&A stats:', err);
    }
  }, [token]);

  const fetchOptions = useCallback(async () => {
    try {
      const options = await projectService.fetchDropdownOptions(token);
      if (!options) return;

      if (options.isoOptions) setIsoOptions(options.isoOptions);

      if (options.maTierOptions) {
        setMaTierOptions(options.maTierOptions.map(t => ({
          value: t.name || t.value,
          color: t.color_hex || t.color
        })));
      }
    } catch (err) {
      // not critical
    }
  }, [token]);

  const fetchCustomFields = useCallback(async () => {
    try {
      const fields = await projectService.fetchCustomFields(token);
      setCustomFields(fields);
    } catch (err) {
      console.error('Failed to fetch custom fields:', err);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchProjects();
      fetchStats();
      fetchOptions();
      fetchCustomFields();
    }
  }, [token, fetchProjects, fetchStats, fetchOptions, fetchCustomFields]);

  // Sort handler
  const handleSort = (newSort) => {
    setSortConfig(newSort);
    setCurrentPage(1);
  };

  // Pagination handler
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Edit mode handlers
  const handleEditChange = (projectId, field, value) => {
    setEditedRows((prev) => ({
      ...prev,
      [projectId]: {
        ...(prev[projectId] || {}),
        [field]: value
      }
    }));
  };

  // Batch save
  const handleBatchSave = async () => {
    const dirtyIds = Object.keys(editedRows);
    if (dirtyIds.length === 0) return;

    setIsSaving(true);
    setSaveResults({});
    setBatchError('');

    const results = await Promise.allSettled(
      dirtyIds.map((id) =>
        projectService.updateProject(id, editedRows[id], token).then(() => id)
      )
    );

    const newResults = {};
    const failedIds = [];

    results.forEach((result, idx) => {
      const id = dirtyIds[idx];
      if (result.status === 'fulfilled') {
        newResults[id] = 'success';
      } else {
        newResults[id] = 'error';
        failedIds.push(id);
      }
    });

    setSaveResults(newResults);

    // Remove succeeded rows from editedRows, keep failed ones
    setEditedRows((prev) => {
      const next = {};
      failedIds.forEach((id) => {
        if (prev[id]) next[id] = prev[id];
      });
      return next;
    });

    setIsSaving(false);

    // Refresh data
    fetchProjects();
    fetchStats();

    if (failedIds.length > 0) {
      setBatchError(`${failedIds.length} row${failedIds.length !== 1 ? 's' : ''} failed to save. You can retry.`);
    } else {
      // All succeeded — auto-exit edit mode after 2s
      saveTimerRef.current = setTimeout(() => {
        setSaveResults({});
        setEditMode(false);
        setEditedRows({});
      }, 2000);
    }

    // Clear success indicators after 2s
    setTimeout(() => {
      setSaveResults((prev) => {
        const next = {};
        Object.entries(prev).forEach(([id, status]) => {
          if (status === 'error') next[id] = 'error';
        });
        return next;
      });
    }, 2000);
  };

  // Discard all edits and exit edit mode
  const discardAndExit = () => {
    setEditedRows({});
    setEditMode(false);
    setSaveResults({});
    setBatchError('');
  };

  // Batch cancel
  const handleBatchCancel = () => {
    if (dirtyCount > 0) {
      setConfirmAction(() => discardAndExit);
      return;
    }
    discardAndExit();
  };

  const toggleEditMode = () => {
    if (editMode) {
      if (dirtyCount > 0) {
        setConfirmAction(() => discardAndExit);
        return;
      }
      discardAndExit();
      return;
    }
    setEditMode(true);
  };

  // Add project handler
  const handleAddProject = async (projectData) => {
    await projectService.createProject(projectData, token);
    fetchProjects();
    fetchStats();
  };

  // Custom field handlers
  const handleAddCustomField = async (displayName, dataType) => {
    await projectService.addCustomField(displayName, dataType, token);
    await fetchCustomFields();
    fetchProjects(); // Reload to get new column data
  };

  const handleRemoveCustomField = async (fieldId) => {
    await projectService.removeCustomField(fieldId, token);
    await fetchCustomFields();
    fetchProjects();
  };

  return (
    <div className="ma-page">
      {/* Header */}
      <div className="ma-header">
        <div>
          <h1 className="ma-title">M&A Pipeline</h1>
          <p className="ma-subtitle">Manage active acquisition opportunities and valuations.</p>
        </div>
        <div className="ma-header-actions">
          <div className="ma-search-wrapper">
            <span className="ma-search-icon">&#128269;</span>
            <input
              type="text"
              className="ma-search-input"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="ma-search-clear" onClick={() => setSearchTerm('')}>
                &#10005;
              </button>
            )}
          </div>
          <div className="ma-edit-toggle-group">
            <span className="ma-toggle-label">View</span>
            <label className="ma-toggle">
              <input type="checkbox" checked={editMode} onChange={toggleEditMode} />
              <span className="ma-toggle-slider"></span>
            </label>
            <span className="ma-toggle-label">Edit</span>
          </div>
          <button className="ma-btn ma-btn-secondary" onClick={() => setShowFieldModal(true)}>
            Manage Fields
          </button>
          <button className="ma-btn ma-btn-primary" onClick={() => setShowAddModal(true)}>
            + New Project
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <MAKPICards stats={maStats} loading={!maStats} />

      {/* Table */}
      <MATable
        projects={projects}
        loading={loading}
        editMode={editMode}
        editedRows={editedRows}
        onEditChange={handleEditChange}
        sortConfig={sortConfig}
        onSort={handleSort}
        currentPage={currentPage}
        totalCount={totalCount}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        isoOptions={isoOptions}
        maTierOptions={maTierOptions}
        customFields={customFields}
        saveResults={saveResults}
      />

      {/* Batch Action Bar */}
      {editMode && (
        <MABatchActionBar
          dirtyCount={dirtyCount}
          isSaving={isSaving}
          errorMessage={batchError}
          onSave={handleBatchSave}
          onCancel={handleBatchCancel}
        />
      )}

      {/* Add Project Modal */}
      <MAAddProjectModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddProject}
        isoOptions={isoOptions}
        maTierOptions={maTierOptions}
        customFields={customFields}
      />

      {/* Custom Field Management Modal */}
      <MACustomFieldModal
        isOpen={showFieldModal}
        onClose={() => setShowFieldModal(false)}
        customFields={customFields}
        onAdd={handleAddCustomField}
        onRemove={handleRemoveCustomField}
      />

      {/* Confirm Discard Modal */}
      <MAConfirmModal
        isOpen={!!confirmAction}
        title="Unsaved Changes"
        message={`You have ${dirtyCount} unsaved change${dirtyCount !== 1 ? 's' : ''}. Discard them?`}
        confirmLabel="Discard"
        cancelLabel="Keep Editing"
        onConfirm={() => {
          confirmAction();
          setConfirmAction(null);
        }}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
};

export default MAPage;
