import { useState, useCallback } from 'react';

const INITIAL_SITE_DATA = {
  project_name: '',
  project_codename: '',
  plant_owner: '',
  location: '',
  legacy_nameplate_capacity_mw: '',
  tech: '',
  heat_rate_btu_kwh: '',
  capacity_factor_2024: '',
  legacy_cod: '',
  fuel: '',
  site_acreage: '',
  iso: '',
  zone_submarket: '',
  markets: '',
  process_type: '',
  gas_reference: '',
  redevelopment_base_case: '',
  redev_cod: '',
  thermal_optimization: '',
  co_locate_repower: '',
  contact: '',
  overall_project_score: '',
  thermal_operating_score: '',
  redevelopment_score: '',
  redevelopment_load_score: '',
  ic_score: '',
  environmental_score: '',
  market_score: '',
  redev_tier: '',
  redev_capacity_mw: '',
  redev_tech: '',
  redev_fuel: '',
  redev_heatrate_btu_kwh: '',
  redev_land_control: '',
  redev_stage_gate: '',
  redev_lead: '',
  redev_support: '',
  project_type: '',
  status: '',
  ma_tier: '',
  transactability_scores: '',
  transactability: '',
  poi_voltage_kv: ''
};

export function useModalManager() {
  // Project detail modal
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectDetail, setShowProjectDetail] = useState(false);

  // Edit modal
  const [editingProject, setEditingProject] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Expert analysis
  const [showExpertScores, setShowExpertScores] = useState(false);
  const [selectedExpertProject, setSelectedExpertProject] = useState(null);
  const [expertAnalysisFilter, setExpertAnalysisFilter] = useState('');

  // Other modals
  const [showScoringPanel, setShowScoringPanel] = useState(false);
  const [showAddSiteModal, setShowAddSiteModal] = useState(false);
  const [showScoringModal, setShowScoringModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false);

  // Form data
  const [newSiteData, setNewSiteData] = useState(INITIAL_SITE_DATA);
  const [validationErrors, setValidationErrors] = useState({});

  // Notification
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  const openAddSiteModal = useCallback(() => {
    setNewSiteData(INITIAL_SITE_DATA);
    setValidationErrors({});
    setShowAddSiteModal(true);
  }, []);

  const closeAddSiteModal = useCallback(() => {
    setShowAddSiteModal(false);
    setNewSiteData(INITIAL_SITE_DATA);
    setValidationErrors({});
  }, []);

  const closeEditModal = useCallback(() => {
    setShowEditModal(false);
    setEditingProject(null);
    setValidationErrors({});
  }, []);

  const closeProjectDetail = useCallback(() => {
    setShowProjectDetail(false);
    setSelectedProject(null);
  }, []);

  const handleEditProject = useCallback((project) => {
    const fullProjectData = {
      ...project.detailData,
      ...project,
    };
    setEditingProject(fullProjectData);
    setShowEditModal(true);
  }, []);

  return {
    // Project detail
    selectedProject, setSelectedProject,
    showProjectDetail, setShowProjectDetail,
    closeProjectDetail,

    // Edit
    editingProject, setEditingProject,
    showEditModal, setShowEditModal,
    closeEditModal,
    handleEditProject,

    // Expert
    showExpertScores, setShowExpertScores,
    selectedExpertProject, setSelectedExpertProject,
    expertAnalysisFilter, setExpertAnalysisFilter,

    // Other modals
    showScoringPanel, setShowScoringPanel,
    showAddSiteModal, setShowAddSiteModal,
    showScoringModal, setShowScoringModal,
    showExportModal, setShowExportModal,
    showUploadModal, setShowUploadModal,
    showActivityLog, setShowActivityLog,

    // Form
    newSiteData, setNewSiteData,
    validationErrors, setValidationErrors,
    openAddSiteModal,
    closeAddSiteModal,

    // Notification
    notification, setNotification,
  };
}
