import React, { useState, useEffect } from 'react';
import { sortableColumns } from '../../constants/scoringWeights';

const PipelineTable = ({
  pipelineRows,
  sortConfig,
  handleSort,
  getSortDirectionClass,
  resetSort,
  getSortedPipelineRows,
  handleProjectClick,
  activeTechFilter,
  clearTechFilter,
  clearCounterpartyFilter,
  clearIsoFilter,
  clearRedevFilter,
  activeCounterpartyFilter,
  activeIsoFilter,
  activeRedevFilter,
  selectedProjectType // ADDED: This prop tells us which project type filter is active
}) => {

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState('all');
  const [isAdvancedSearch, setIsAdvancedSearch] = useState(false);
  const [filteredRows, setFilteredRows] = useState(pipelineRows);
  const [showFieldDropdown, setShowFieldDropdown] = useState(false);
  
  // Searchable fields - ADDED: poiVoltage
  const searchableFields = [
    { value: 'all', label: 'All Fields' },
    { value: 'asset', label: 'Project Name' },
    { value: 'location', label: 'Location' },
    { value: 'owner', label: 'Owner' },
    { value: 'status', label: 'Status' },
    { value: 'maTier', label: 'M&A Tier' },
    { value: 'redevTier', label: 'Redevelopment Tier' },
    { value: 'mkt', label: 'Market (ISO)' },
    { value: 'zone', label: 'Zone' },
    { value: 'tech', label: 'Technology' },
    { value: 'cod', label: 'COD' },
    { value: 'fuel', label: 'Fuel' },
    { value: 'contact', label: 'Contact' },
    { value: 'redevBaseCase', label: 'Redevelopment Base Case' },
    { value: 'redevCapacity', label: 'Redevelopment Capacity' },
    { value: 'redevTech', label: 'Redevelopment Tech' },
    { value: 'redevFuel', label: 'Redevelopment Fuel' },
    { value: 'redevLead', label: 'Redevelopment Lead' },
    { value: 'redevStageGate', label: 'Redevelopment Stage Gate' },
    { value: 'projectType', label: 'Project Type' },
    { value: 'poiVoltage', label: 'POI Voltage' }, // ADDED: POI Voltage
  ];

  // Load saved search preferences
  useEffect(() => {
    const savedSearchTerm = sessionStorage.getItem('pipelineSearchTerm');
    const savedSearchField = sessionStorage.getItem('pipelineSearchField');
    const savedAdvancedSearch = sessionStorage.getItem('pipelineAdvancedSearch');
    
    if (savedSearchTerm) setSearchTerm(savedSearchTerm);
    if (savedSearchField) setSearchField(savedSearchField);
    if (savedAdvancedSearch) setIsAdvancedSearch(savedAdvancedSearch === 'true');
  }, []);

  // Save search preferences
  useEffect(() => {
    sessionStorage.setItem('pipelineSearchTerm', searchTerm);
    sessionStorage.setItem('pipelineSearchField', searchField);
    sessionStorage.setItem('pipelineAdvancedSearch', isAdvancedSearch.toString());
  }, [searchTerm, searchField, isAdvancedSearch]);

  // Filter rows based on search and filters
  useEffect(() => {
    let filtered = pipelineRows;
    
    // Apply tech filter
    if (activeTechFilter) {
      filtered = filtered.filter(row => {
        const matchesTech = row.tech?.toLowerCase().includes(activeTechFilter.toLowerCase());
        const matchesRedevTech = row.redevTech?.toLowerCase().includes(activeTechFilter.toLowerCase());
        
        if (activeTechFilter === 'Gas/Thermal') {
          return row.tech?.toLowerCase().includes('gas') || 
                 row.tech?.toLowerCase().includes('thermal') ||
                 row.fuel?.toLowerCase().includes('gas') ||
                 row.redevFuel?.toLowerCase().includes('gas');
        }
        
        return matchesTech || matchesRedevTech;
      });
    }
    
    // Apply counterparty filter
    if (activeCounterpartyFilter) {
      filtered = filtered.filter(row => {
        return row.owner?.toLowerCase() === activeCounterpartyFilter.toLowerCase();
      });
    }
    
    // Apply search filter
    if (searchTerm.trim()) {
      const searchTerms = searchTerm.toLowerCase().split(/\s+/).filter(term => term.length > 0);
      
      filtered = filtered.filter(row => {
        if (!isAdvancedSearch) {
          const searchableValues = [
            row.asset || '',
            row.location || '',
            row.owner || '',
            row.status || '',
            row.maTier || '',
            row.redevTier || '',
            row.mkt || '',
            row.zone || '',
            row.tech || '',
            row.cod || '',
            row.fuel || '',
            row.contact || '',
            row.redevBaseCase || '',
            row.redevCapacity?.toString() || '',
            row.redevTech || '',
            row.redevFuel || '',
            row.redevLead || '',
            row.redevStageGate || '',
            row.projectType || '',
            row.overall?.toString() || '',
            row.thermal?.toString() || '',
            row.redev?.toString() || '',
            row.transactabilityScore?.toString() || '',
            row.mw?.toString() || '',
            row.hr?.toString() || '',
            row.cf?.toString() || '',
            row.poiVoltage?.toString() || '', // ADDED: POI Voltage
          ];
          
          const rowText = searchableValues.join(' ').toLowerCase();
          return searchTerms.every(term => rowText.includes(term));
        }
        
        if (searchField === 'all') {
          const searchableValues = [
            row.asset || '',
            row.location || '',
            row.owner || '',
            row.status || '',
            row.maTier || '',
            row.redevTier || '',
            row.mkt || '',
            row.zone || '',
            row.tech || '',
            row.cod || '',
            row.fuel || '',
            row.contact || '',
            row.redevBaseCase || '',
            row.redevCapacity?.toString() || '',
            row.redevTech || '',
            row.redevFuel || '',
            row.redevLead || '',
            row.redevStageGate || '',
            row.projectType || '',
            row.overall?.toString() || '',
            row.thermal?.toString() || '',
            row.redev?.toString() || '',
            row.transactabilityScore?.toString() || '',
            row.poiVoltage?.toString() || '', // ADDED: POI Voltage
          ];
          
          const rowText = searchableValues.join(' ').toLowerCase();
          return searchTerms.every(term => rowText.includes(term));
        } else {
          const fieldValue = row[searchField] || '';
          const fieldText = fieldValue.toString().toLowerCase();
          return searchTerms.every(term => fieldText.includes(term));
        }
      });
    }
    
    setFilteredRows(filtered);
  }, [searchTerm, searchField, isAdvancedSearch, pipelineRows, activeTechFilter, activeCounterpartyFilter]);

  // Get sorted rows from filtered results
  const getSortedFilteredRows = () => {
    const rowsToSort = [...filteredRows];
    
    // If manual sorting is active, apply it
    if (!sortConfig.column || sortConfig.direction === 'none') {
      return rowsToSort;
    }
    
    const column = sortableColumns.find(col => col.key === sortConfig.column);
    if (!column) return rowsToSort;
    
    return rowsToSort.sort((a, b) => {
      let aValue = a[sortConfig.column];
      let bValue = b[sortConfig.column];
      
      if (aValue == null) aValue = column.type === 'string' ? '' : 0;
      if (bValue == null) bValue = column.type === 'string' ? '' : 0;
      
      // Special handling for Redev Tier when manually sorting
      if (sortConfig.column === 'redevTier') {
        const tierOrder = {
          '0': 0, 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5,
          '1': 1, '2': 2, '3': 3, '4': 4, '5': 5,
          'i': 1, 'ii': 2, 'iii': 3, 'iv': 4, 'v': 5
        };
        
        const getTierValue = (tier) => {
          if (tier === undefined || tier === null || tier === '') return 999;
          const tierStr = String(tier).trim();
          return tierOrder[tierStr] !== undefined ? tierOrder[tierStr] : 999;
        };
        
        const aTierValue = getTierValue(aValue);
        const bTierValue = getTierValue(bValue);
        
        return sortConfig.direction === 'asc' ? aTierValue - bTierValue : bTierValue - aTierValue;
      }
      
      // Special handling for M&A Tier
      if (sortConfig.column === 'maTier') {
        const maTierOrder = {
          'owned': 0,
          'signed': 1,
          'exclusivity': 2,
          'second round': 3,
          'first round': 4,
          'pipeline': 5,
          'passed': 6
        };
        
        const getMaTierValue = (tier) => {
          if (!tier) return 999;
          const tierStr = String(tier).trim().toLowerCase();
          return maTierOrder[tierStr] !== undefined ? maTierOrder[tierStr] : 999;
        };
        
        const aTierValue = getMaTierValue(aValue);
        const bTierValue = getMaTierValue(bValue);
        
        return sortConfig.direction === 'asc' ? aTierValue - bTierValue : bTierValue - aTierValue;
      }
      
      if (sortConfig.column === 'cf') {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      }
      
      if (column.type === 'string') {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
        
        if (sortConfig.direction === 'asc') {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      }
      
      if (column.type === 'number') {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
        
        if (sortConfig.direction === 'asc') {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      }
      
      return 0;
    });
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setShowFieldDropdown(false);
    
    if (clearTechFilter && typeof clearTechFilter === 'function') clearTechFilter();
    if (clearCounterpartyFilter && typeof clearCounterpartyFilter === 'function') clearCounterpartyFilter();
    if (clearIsoFilter && typeof clearIsoFilter === 'function') clearIsoFilter();
    if (clearRedevFilter && typeof clearRedevFilter === 'function') clearRedevFilter();
  };

  // Toggle advanced search
  const toggleAdvancedSearch = () => {
    setIsAdvancedSearch(!isAdvancedSearch);
    if (!isAdvancedSearch && searchField === 'all') {
      setSearchField('asset');
    }
  };

  // Get current search field label
  const getCurrentFieldLabel = () => {
    const field = searchableFields.find(f => f.value === searchField);
    return field ? field.label : 'All Fields';
  };

  // Format redev capacity
  const formatRedevCapacity = (value) => {
    if (value === undefined || value === null || value === '') return '';
    if (typeof value === 'number') return value.toLocaleString();
    return value;
  };

  // Format project type
  const formatProjectType = (value) => {
    if (!value) return '';
    if (typeof value === 'string' && value.includes(',')) {
      return value.split(',').map(type => type.trim()).filter(type => type);
    }
    return [value];
  };

  // Format M&A Tier badge
  const formatMaTier = (value) => {
    if (!value) return '';
    const tier = value.toString().trim().toLowerCase();
    
    // Define colors for each M&A tier
    const tierColors = {
      'owned': '#8b5cf6', // purple
      'signed': '#22c55e', // green (brighter)
      'exclusivity': '#10b981', // green (teal)
      'second round': '#3b82f6', // blue
      'first round': '#f59e0b', // amber
      'pipeline': '#6b7280', // gray
      'passed': '#ef4444' // red
    };
    
    return {
      text: value,
      color: tierColors[tier] || '#6b7280'
    };
  };

  // Format Status badge
  const formatStatus = (value) => {
    if (!value) return '';
    const status = value.toString().trim().toLowerCase();
    
    // Define colors for each status
    const statusColors = {
      'operating': '#10b981', // green
      'future': '#3b82f6', // blue
      'development': '#f59e0b', // amber
      'proposed': '#8b5cf6', // purple
      'retired': '#ef4444', // red
      'cancelled': '#6b7280', // gray
      'unknown': '#9ca3af' // light gray
    };
    
    return {
      text: value,
      color: statusColors[status] || '#9ca3af'
    };
  };

  return (
    <div className="card-body pipeline-body">
      {/* Search Bar Header Row */}
      <div className="pipeline-header-row">
        <div className="pipeline-header-info">
          <strong>Pipeline Details</strong>
          {searchTerm && (
            <span className="pipeline-filter-indicator blue">
              Filtered: {filteredRows.length} of {pipelineRows.length} projects
            </span>
          )}
          {activeTechFilter && (
            <span className="pipeline-filter-indicator green">
              🔍 Filtered by Tech: {activeTechFilter}
            </span>
          )}
          {activeCounterpartyFilter && (
            <span className="pipeline-filter-indicator purple">
              🔍 Filtered by Counterparty: {activeCounterpartyFilter}
            </span>
          )}
          {/* NEW: Display automatic sorting info */}
          {selectedProjectType === 'Redev' && (
            <span className="pipeline-filter-indicator green">
              ⬆ Sorted by: Redev Tier (ascending)
            </span>
          )}
          {selectedProjectType === 'M&A' && (
            <span className="pipeline-filter-indicator amber">
              ⬆ Sorted by: M&A Tier (Owned → Signed → Exclusivity → Second round → First round → Pipeline → Passed)
            </span>
          )}
        </div>

        <div className="pipeline-search-container">
          {/* Search Input */}
          <div className="pipeline-search-wrapper">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder={isAdvancedSearch ? `Search in ${getCurrentFieldLabel().toLowerCase()}...` : "Search all fields..."}
              className="pipeline-search-input"
            />
            <svg className="pipeline-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>

            {(searchTerm || activeTechFilter || activeCounterpartyFilter) && (
              <button onClick={clearAllFilters} className="pipeline-search-clear" title="Clear all filters">
                ×
              </button>
            )}
          </div>

          {/* Advanced Search Toggle */}
          <button
            onClick={toggleAdvancedSearch}
            className={`pipeline-search-btn ${isAdvancedSearch ? 'active' : ''}`}
            title={isAdvancedSearch ? "Switch to simple search" : "Switch to advanced search"}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {isAdvancedSearch ? (<> <circle cx="11" cy="11" r="8" /> <path d="m21 21-4.35-4.35" /> <path d="M8 11h8" /> </>) : (<> <circle cx="11" cy="11" r="8" /> <path d="m21 21-4.35-4.35" /> <path d="M15 11h-4" /> <path d="M11 15v-8" /> </>)}
            </svg>
            {isAdvancedSearch ? 'Advanced' : 'Search'}
          </button>

          {/* Field Selector */}
          {isAdvancedSearch && (
            <div className="pipeline-field-selector">
              <button
                onClick={() => setShowFieldDropdown(!showFieldDropdown)}
                className="pipeline-field-btn"
                title="Select field to search"
              >
                <span>{getCurrentFieldLabel()}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
              </button>

              {showFieldDropdown && (
                <>
                  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }} onClick={() => setShowFieldDropdown(false)} />
                  <div className="pipeline-field-dropdown">
                    {searchableFields.map(field => (
                      <button
                        key={field.value}
                        onClick={() => { setSearchField(field.value); setShowFieldDropdown(false); }}
                        className={`pipeline-field-option ${searchField === field.value ? 'selected' : ''}`}
                      >
                        {searchField === field.value && (<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>)}
                        <span>{field.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Active Filters Bar */}
      {(searchTerm || activeTechFilter || activeCounterpartyFilter) && (
        <div className="pipeline-active-filters">
          <div>
            <strong>Active Filters:</strong>
            <span style={{ marginLeft: '8px' }}>
              {activeTechFilter && (<span className="pipeline-filter-tag tech">Tech: {activeTechFilter}</span>)}
              {activeCounterpartyFilter && (<span className="pipeline-filter-tag counterparty">Counterparty: {activeCounterpartyFilter}</span>)}
              {searchTerm && (<span className="pipeline-filter-tag search">Search: "{searchTerm}"</span>)}
            </span>
          </div>
          <button onClick={clearAllFilters} className="pipeline-clear-filters-btn">Clear All Filters</button>
        </div>
      )}

      {/* Table */}
      <div className="table-wrapper">
        <table className="pipeline-table">
          <thead>
            <tr>
              <th className={`sortable-header ${getSortDirectionClass('id')}`} onClick={() => handleSort('id')}>
                #
              </th>
              <th className={`sortable-header ${getSortDirectionClass('asset')}`} onClick={() => handleSort('asset')}>
                Asset
              </th>
              <th className={`sortable-header ${getSortDirectionClass('owner')}`} onClick={() => handleSort('owner')}>
                Owner
              </th>
              {/* NEW: Project Type column */}
              <th className={`sortable-header ${getSortDirectionClass('projectType')}`} onClick={() => handleSort('projectType')}>
                Project Type
              </th>
              {/* NEW: M&A Tier column */}
              <th className={`sortable-header ${getSortDirectionClass('maTier')}`} onClick={() => handleSort('maTier')}>
                M&A Tier
              </th>
              {/* MOVED: Redev Tier column - Now directly after M&A Tier */}
              <th className={`sortable-header ${getSortDirectionClass('redevTier')}`} onClick={() => handleSort('redevTier')}>
                Redev Tier
              </th>
              {/* NEW: Status column - Moved after Redev Tier */}
              <th className={`sortable-header ${getSortDirectionClass('status')}`} onClick={() => handleSort('status')}>
                Status
              </th>
              <th className={`sortable-header ${getSortDirectionClass('overall')}`} onClick={() => handleSort('overall')}>
                Overall
              </th>
              <th className={`sortable-header ${getSortDirectionClass('thermal')}`} onClick={() => handleSort('thermal')}>
                Thermal
              </th>
              <th className={`sortable-header ${getSortDirectionClass('redev')}`} onClick={() => handleSort('redev')}>
                Redev
              </th>
              <th className={`sortable-header ${getSortDirectionClass('mkt')}`} onClick={() => handleSort('mkt')}>
                Mkt
              </th>
              <th className={`sortable-header ${getSortDirectionClass('zone')}`} onClick={() => handleSort('zone')}>
                Zone
              </th>
              <th className={`sortable-header ${getSortDirectionClass('mw')}`} onClick={() => handleSort('mw')}>
                MW
              </th>
              {/* NEW: POI Voltage column - Added after MW */}
              <th className={`sortable-header ${getSortDirectionClass('poiVoltage')}`} onClick={() => handleSort('poiVoltage')}>
                POI Voltage (KV)
              </th>
              <th className={`sortable-header ${getSortDirectionClass('tech')}`} onClick={() => handleSort('tech')}>
                Tech
              </th>
              <th className={`sortable-header ${getSortDirectionClass('hr')}`} onClick={() => handleSort('hr')}>
                HR
              </th>
              <th className={`sortable-header ${getSortDirectionClass('cf')}`} onClick={() => handleSort('cf')}>
                CF
              </th>
              <th className={`sortable-header ${getSortDirectionClass('cod')}`} onClick={() => handleSort('cod')}>
                COD
              </th>
              {/* MOVED: Redevelopment columns to come after COD */}
              {/* Redevelopment Base Case column */}
              <th className={`sortable-header ${getSortDirectionClass('redevBaseCase')}`} onClick={() => handleSort('redevBaseCase')}>
                Redev Case
              </th>
              {/* Redevelopment Capacity column */}
              <th className={`sortable-header ${getSortDirectionClass('redevCapacity')}`} onClick={() => handleSort('redevCapacity')}>
                Redev MW
              </th>
              {/* Redevelopment Tech column */}
              <th className={`sortable-header ${getSortDirectionClass('redevTech')}`} onClick={() => handleSort('redevTech')}>
                Redev Tech
              </th>
              {/* Redevelopment Stage Gate column */}
              <th className={`sortable-header ${getSortDirectionClass('redevStageGate')}`} onClick={() => handleSort('redevStageGate')}>
                Stage Gate
              </th>
              {/* Transactability Score column */}
              <th className={`sortable-header ${getSortDirectionClass('transactabilityScore')}`} onClick={() => handleSort('transactabilityScore')}>
                Transact Score
              </th>
            </tr>
          </thead>
          <tbody>
            {getSortedFilteredRows().length > 0 ? (
              getSortedFilteredRows().map((row, index) => (
                <tr 
                  key={row.id} 
                  className={`pipeline-row ${sortConfig.column && row[sortConfig.column] !== undefined ? 'active-sort' : ''}`}
                  onClick={() => handleProjectClick(row)}
                >
                  {/* FIXED: Use sequential index + 1 for display instead of row.id */}
                  <td className="col-rank">{index + 1}</td>
                  <td className="col-asset">
                    <div className="asset-name">{row.asset}</div>
                    <div className="asset-location">{row.location}</div>
                  </td>
                  <td>{row.owner}</td>
                  {/* Project Type cell */}
                  <td>
                    {row.projectType ? (
                      <div style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: '4px',
                        maxWidth: '150px'
                      }}>
                        {formatProjectType(row.projectType).map((type, typeIndex) => (
                          <span 
                            key={typeIndex}
                            className="tag tag-blue" 
                            style={{ 
                              fontSize: '10px',
                              padding: '2px 6px',
                              borderRadius: '10px',
                              backgroundColor: 
                                type === 'All' ? '#3b82f6' :
                                type === 'Redev' ? '#10b981' :
                                type === 'M&A' ? '#f59e0b' :
                                type === 'Owned' ? '#8b5cf6' : '#6b7280',
                              color: 'white',
                              display: 'inline-block'
                            }}
                            title={type}
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '12px' }}>-</span>
                    )}
                  </td>
                  {/* NEW: M&A Tier cell */}
                  <td>
                    {row.maTier ? (
                      <span className="badge" style={{ 
                        backgroundColor: formatMaTier(row.maTier).color,
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 'bold'
                      }}>
                        {formatMaTier(row.maTier).text}
                      </span>
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '12px' }}>-</span>
                    )}
                  </td>
                  {/* MOVED: Redev Tier cell - Now directly after M&A Tier */}
                  <td>
                    {row.redevTier ? (
                      <span className="badge badge-purple">
                        {row.redevTier}
                      </span>
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '12px' }}>-</span>
                    )}
                  </td>
                  {/* NEW: Status cell - Moved after Redev Tier */}
                  <td>
                    {row.status ? (
                      <span className="badge" style={{ 
                        backgroundColor: formatStatus(row.status).color,
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 'bold'
                      }}>
                        {formatStatus(row.status).text}
                      </span>
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '12px' }}>-</span>
                    )}
                  </td>
                  <td>
                    {row.overall === null ? (
                      <span className="badge badge-gray" style={{ backgroundColor: '#6b7280', color: '#e5e7eb' }}>
                        N/A
                      </span>
                    ) : (
                      <span className="badge badge-green">
                        {row.overall.toFixed(2)}
                      </span>
                    )}
                  </td>
                  <td>
                    {row.thermal === null ? (
                      <span className="badge badge-gray" style={{ backgroundColor: '#6b7280', color: '#e5e7eb' }}>
                        N/A
                      </span>
                    ) : (
                      <span className="badge badge-red">
                        {row.thermal.toFixed(2)}
                      </span>
                    )}
                  </td>
                  <td>
                    {row.redev === null ? (
                      <span className="badge badge-gray" style={{ backgroundColor: '#6b7280', color: '#e5e7eb' }}>
                        N/A
                      </span>
                    ) : (
                      <span className="badge badge-teal">
                        {row.redev.toFixed(2)}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="tag tag-dark">{row.mkt}</span>
                  </td>
                  <td>{row.zone}</td>
                  <td>{row.mw.toLocaleString()}</td>
                  {/* NEW: POI Voltage cell */}
                  <td>
                    {row.poiVoltage ? (
                      <span className="badge badge-blue">
                        {row.poiVoltage}
                      </span>
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '12px' }}>-</span>
                    )}
                  </td>
                  <td>
                    <span className="tag tag-yellow">{row.tech}</span>
                  </td>
                  <td>{row.hr.toLocaleString()}</td>
                  <td>{row.cf}</td>
                  <td>{row.cod}</td>
                  {/* MOVED: Redevelopment cells to come after COD */}
                  {/* Redevelopment Base Case cell */}
                  <td>
                    {row.redevBaseCase ? (
                      <span className="tag tag-blue" style={{ 
                        maxWidth: '120px', 
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        display: 'inline-block'
                      }} title={row.redevBaseCase}>
                        {row.redevBaseCase}
                      </span>
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '12px' }}>-</span>
                    )}
                  </td>
                  {/* Redevelopment Capacity cell */}
                  <td>
                    {row.redevCapacity ? (
                      <span className="badge badge-orange">
                        {formatRedevCapacity(row.redevCapacity)}
                      </span>
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '12px' }}>-</span>
                    )}
                  </td>
                  {/* Redevelopment Tech cell */}
                  <td>
                    {row.redevTech ? (
                      <span className="tag tag-yellow">
                        {row.redevTech}
                      </span>
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '12px' }}>-</span>
                    )}
                  </td>
                  {/* Redevelopment Stage Gate cell */}
                  <td>
                    {row.redevStageGate ? (
                      <span className="badge badge-blue">
                        {row.redevStageGate}
                      </span>
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '12px' }}>-</span>
                    )}
                  </td>
                  {/* Transactability Score cell */}
                  <td>
                    <span className="badge badge-purple">
                      {row.transactabilityScore !== undefined && row.transactabilityScore !== "" && row.transactabilityScore !== "#N/A" && row.transactabilityScore !== "N/A"
                        ? (typeof row.transactabilityScore === 'number' ? row.transactabilityScore.toFixed(2) : row.transactabilityScore)
                        : "N/A"}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              // No results message - UPDATED column count to 24 (added POI Voltage)
              <tr>
                <td colSpan="23" style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#6b7280',
                  fontSize: '14px'
                }}>
                  <div style={{ marginBottom: '12px' }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1">
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.35-4.35" />
                      <path d="M8 11h6" />
                    </svg>
                  </div>
                  <strong>No projects found</strong>
                  <div style={{ marginTop: '8px', fontSize: '12px' }}>
                    {activeTechFilter ? `No projects matching "${activeTechFilter}" technology` : 
                     activeCounterpartyFilter ? `No projects matching counterparty "${activeCounterpartyFilter}"` :
                     'Try adjusting your search terms or switching search mode'}
                  </div>
                  <button onClick={clearAllFilters} style={{ marginTop: '16px', padding: '6px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                    Clear All Filters
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div style={{ fontSize: '10px', color: '#6b7280', textAlign: 'right', paddingTop: '8px', paddingRight: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ marginRight: '12px' }}><span style={{ color: '#3b82f6', fontWeight: 'bold' }}>↑↓</span> Click headers to sort</span>
          <span><span style={{ color: '#ef4444', fontWeight: 'bold' }}>×</span> Reset to clear sort</span>
          <span style={{ marginLeft: '12px' }}><span style={{ color: '#10b981', fontWeight: 'bold' }}>⚡</span> Click chart items to filter</span>
        
         {/* NEW: Automatic sorting indicator */}
          {selectedProjectType === 'Redev' && (
            <span style={{ marginLeft: '12px' }}><span style={{ color: '#10b981', fontWeight: 'bold' }}>⬆</span> Auto-sorted: Redev Tier (ascending)</span>
          )}
          {selectedProjectType === 'M&A' && (
            <span style={{ marginLeft: '12px' }}><span style={{ color: '#f59e0b', fontWeight: 'bold' }}>⬆</span> Auto-sorted: M&A Tier (custom order)</span>
          )}
                  </div>
        <div>
          Showing {getSortedFilteredRows().length} of {pipelineRows.length} projects
          {(searchTerm || activeTechFilter || activeCounterpartyFilter) && filteredRows.length < pipelineRows.length && (
            <span style={{ marginLeft: '8px', color: '#3b82f6' }}>(Filtered from {pipelineRows.length})</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PipelineTable;
