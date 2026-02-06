import { useState, useCallback } from 'react';

export function useFilters() {
  const [selectedIso, setSelectedIso] = useState('All');
  const [selectedProcess, setSelectedProcess] = useState('All');
  const [selectedOwner, setSelectedOwner] = useState('All');
  const [selectedTransmissionVoltage, setSelectedTransmissionVoltage] = useState('All');
  const [selectedHasExcessCapacity, setSelectedHasExcessCapacity] = useState('All');
  const [selectedProjectType, setSelectedProjectType] = useState('All');
  const [activeTechFilter, setActiveTechFilter] = useState(null);
  const [activeIsoFilter, setActiveIsoFilter] = useState(null);
  const [activeRedevFilter, setActiveRedevFilter] = useState(null);
  const [activeCounterpartyFilter, setActiveCounterpartyFilter] = useState(null);

  const handleFilterByTech = useCallback((tech) => {
    setActiveTechFilter(prev => prev === tech ? null : tech);
  }, []);

  const handleFilterByIso = useCallback((iso) => {
    setActiveIsoFilter(prev => prev === iso ? null : iso);
  }, []);

  const handleFilterByRedev = useCallback((redevType) => {
    setActiveRedevFilter(prev => prev === redevType ? null : redevType);
  }, []);

  const handleFilterByCounterparty = useCallback((counterparty) => {
    setActiveCounterpartyFilter(prev => prev === counterparty ? null : counterparty);
  }, []);

  const clearAllFilters = useCallback((resetSort) => {
    setSelectedIso('All');
    setSelectedProcess('All');
    setSelectedOwner('All');
    setSelectedTransmissionVoltage('All');
    setSelectedHasExcessCapacity('All');
    setSelectedProjectType('All');
    setActiveTechFilter(null);
    setActiveIsoFilter(null);
    setActiveRedevFilter(null);
    setActiveCounterpartyFilter(null);
    if (resetSort) resetSort();
  }, []);

  const currentFilters = {
    selectedIso,
    selectedProcess,
    selectedOwner,
    selectedTransmissionVoltage,
    selectedHasExcessCapacity,
    selectedProjectType,
    activeTechFilter,
    activeIsoFilter,
    activeRedevFilter,
    activeCounterpartyFilter
  };

  return {
    selectedIso, setSelectedIso,
    selectedProcess, setSelectedProcess,
    selectedOwner, setSelectedOwner,
    selectedTransmissionVoltage, setSelectedTransmissionVoltage,
    selectedHasExcessCapacity, setSelectedHasExcessCapacity,
    selectedProjectType, setSelectedProjectType,
    activeTechFilter, setActiveTechFilter,
    activeIsoFilter, setActiveIsoFilter,
    activeRedevFilter, setActiveRedevFilter,
    activeCounterpartyFilter, setActiveCounterpartyFilter,
    handleFilterByTech,
    handleFilterByIso,
    handleFilterByRedev,
    handleFilterByCounterparty,
    clearAllFilters,
    currentFilters
  };
}
