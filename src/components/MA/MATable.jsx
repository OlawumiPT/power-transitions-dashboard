import React, { useMemo } from 'react';
import MATableRow from './MATableRow';
import MAEditRow from './MAEditRow';
import MAPagination from './MAPagination';

const fmtCurrency = (val) => {
  if (val == null || val === '') return '--';
  const num = Number(val);
  if (isNaN(num)) return '--';
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}mm`;
  return `$${num.toLocaleString()}`;
};

const BASE_COLUMNS = [
  { key: 'project_name', label: 'Project Name', sortable: true, align: 'left', minW: 180 },
  { key: 'legacy_nameplate_capacity_mw', label: 'Capacity (MW)', sortable: true, align: 'right', minW: 110 },
  { key: 'ma_investment', label: 'Investment', sortable: true, align: 'right', minW: 130 },
  { key: 'ma_irr', label: 'IRR / MOIC', sortable: true, align: 'center', minW: 120 },
  { key: 'ma_payback_period', label: 'Payback', sortable: true, align: 'center', minW: 90 },
  { key: 'ma_ntm_ebitda', label: 'NTM EBITDA', sortable: true, align: 'right', minW: 130 },
  { key: 'ma_avg_5yr_ebitda', label: 'Avg 5yr EBITDA', sortable: true, align: 'right', minW: 140 },
  { key: 'capacity_factor_2024', label: 'LTM Cap Factor', sortable: true, align: 'center', minW: 110 },
  { key: 'legacy_cod', label: 'COD / Useful Life', sortable: true, align: 'center', minW: 130 },
  { key: 'ma_contracted_hedged_capacity', label: 'Contracted/Hedged', sortable: false, align: 'left', minW: 200 },
  { key: 'ma_capacity_market_structure', label: 'Cap Mkt Structure', sortable: false, align: 'left', minW: 150 },
  { key: 'ma_capacity_contract_term', label: 'Contract Term', sortable: false, align: 'left', minW: 110 },
  { key: 'ma_capacity_contract_price', label: 'Contract Price', sortable: true, align: 'right', minW: 120 },
  { key: 'iso', label: 'Market', sortable: true, align: 'left', minW: 100 },
  { key: 'ma_tier', label: 'Status', sortable: false, align: 'center', minW: 100 },
];

const MATable = ({
  projects,
  loading,
  editMode,
  editedRows,
  onEditChange,
  sortConfig,
  onSort,
  currentPage,
  totalCount,
  pageSize,
  onPageChange,
  isoOptions,
  maTierOptions,
  customFields = [],
  saveResults = {}
}) => {
  // Build full column list: base + custom
  const columns = useMemo(() => {
    const customCols = customFields.map((f) => ({
      key: f.column_name,
      label: f.display_name,
      sortable: false,
      align: f.data_type === 'number' ? 'right' : 'left',
      minW: 120,
      isCustom: true,
      dataType: f.data_type
    }));
    return [...BASE_COLUMNS, ...customCols];
  }, [customFields]);

  const handleSort = (key) => {
    const col = columns.find(c => c.key === key);
    if (!col?.sortable) return;
    let direction = 'ASC';
    if (sortConfig.key === key && sortConfig.direction === 'ASC') {
      direction = 'DESC';
    }
    onSort({ key, direction });
  };

  // Compute footer totals from current page data
  const totals = { capacity: 0, investment: 0, irr: { sum: 0, count: 0 }, payback: { sum: 0, count: 0 }, ebitda: 0 };
  projects.forEach((p) => {
    if (p.legacy_nameplate_capacity_mw) totals.capacity += Number(p.legacy_nameplate_capacity_mw) || 0;
    if (p.ma_investment) totals.investment += Number(p.ma_investment) || 0;
    if (p.ma_irr != null) { totals.irr.sum += Number(p.ma_irr) || 0; totals.irr.count++; }
    if (p.ma_payback_period != null) { totals.payback.sum += Number(p.ma_payback_period) || 0; totals.payback.count++; }
    if (p.ma_ntm_ebitda) totals.ebitda += Number(p.ma_ntm_ebitda) || 0;
  });
  const avgIrr = totals.irr.count > 0 ? (totals.irr.sum / totals.irr.count).toFixed(1) : '--';
  const avgPayback = totals.payback.count > 0 ? (totals.payback.sum / totals.payback.count).toFixed(1) : '--';

  // Count of extra footer cells: custom fields + remaining base cols after the first 6
  const emptyFooterCount = columns.length - 6;

  return (
    <div className="ma-table-container">
      <div className="ma-table-scroll">
        <table className="ma-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`ma-th ma-th-${col.align} ${col.sortable ? 'ma-th-sortable' : ''}`}
                  style={{ minWidth: col.minW }}
                  onClick={() => handleSort(col.key)}
                >
                  {col.label}
                  {col.sortable && sortConfig.key === col.key && (
                    <span className="ma-sort-arrow">
                      {sortConfig.direction === 'ASC' ? ' \u25B2' : ' \u25BC'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="ma-cell ma-cell-center" style={{ padding: '40px' }}>
                  Loading...
                </td>
              </tr>
            ) : projects.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="ma-cell ma-cell-center" style={{ padding: '40px', color: '#94a3b8' }}>
                  No M&A projects found
                </td>
              </tr>
            ) : (
              projects.map((project) =>
                editMode ? (
                  <MAEditRow
                    key={project.id}
                    project={project}
                    editedValues={editedRows[project.id]}
                    onChange={onEditChange}
                    isoOptions={isoOptions}
                    maTierOptions={maTierOptions}
                    customFields={customFields}
                    isDirty={!!editedRows[project.id]}
                    saveResult={saveResults[project.id]}
                  />
                ) : (
                  <MATableRow key={project.id} project={project} customFields={customFields} />
                )
              )
            )}
          </tbody>
          {!loading && projects.length > 0 && (
            <tfoot>
              <tr className="ma-footer-row">
                <td className="ma-cell">Totals / Avg</td>
                <td className="ma-cell ma-cell-right ma-cell-mono">{totals.capacity.toLocaleString()}</td>
                <td className="ma-cell ma-cell-right ma-cell-mono">{fmtCurrency(totals.investment)}</td>
                <td className="ma-cell ma-cell-center">{avgIrr !== '--' ? `${avgIrr}%` : '--'}</td>
                <td className="ma-cell ma-cell-center">{avgPayback !== '--' ? `${avgPayback} Yrs` : '--'}</td>
                <td className="ma-cell ma-cell-right ma-cell-mono">{fmtCurrency(totals.ebitda)}</td>
                {/* Empty cells for remaining columns */}
                {Array.from({ length: emptyFooterCount }, (_, i) => (
                  <td key={i} className="ma-cell"></td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <MAPagination
        currentPage={currentPage}
        totalCount={totalCount}
        pageSize={pageSize}
        onPageChange={onPageChange}
      />
    </div>
  );
};

export default MATable;
