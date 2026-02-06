import React from 'react';

const MAPagination = ({ currentPage, totalCount, pageSize, onPageChange }) => {
  const totalPages = Math.ceil(totalCount / pageSize);
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="ma-pagination">
      <span className="ma-pagination-info">
        Showing <strong>{startItem}-{endItem}</strong> of <strong>{totalCount}</strong> projects
      </span>
      <div className="ma-pagination-controls">
        <button
          className="ma-page-btn ma-page-nav"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          &#8249;
        </button>
        {getPageNumbers().map((page) => (
          <button
            key={page}
            className={`ma-page-btn ${page === currentPage ? 'ma-page-active' : ''}`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}
        <button
          className="ma-page-btn ma-page-nav"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          &#8250;
        </button>
      </div>
    </div>
  );
};

export default MAPagination;
