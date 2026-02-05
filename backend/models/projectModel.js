const database = require('../utils/db');
const pool = database.getPool();
const { calculateAllScores } = require('../utils/scoreCalculations');
const { calculateMarketScore, calculateCODScore, calculateCapacityFactorScore, calculateTransactabilityScore, calculateStatus } = require('../utils/importUtils');

// ========== PROJECT DATA OPERATIONS ==========

const getAllProjects = async (filters = {}) => {
  const {
    iso,
    process_type,
    plant_owner,
    status,
    tech,
    project_type,
    ma_tier,
    limit = 1000,
    offset = 0,
    sort_by = 'project_name',
    sort_order = 'ASC'
  } = filters;

  try {
    // Use schema from environment or default to pipeline_dashboard
    const schema = process.env.DB_SCHEMA || 'pipeline_dashboard';
    
    let query = `
      SELECT 
        p.id,
        p.excel_row_id,
        p.plant_owner,
        p.project_codename,
        p.project_name,
        p.overall_project_score,
        p.thermal_operating_score,
        p.redevelopment_score,
        p.redevelopment_load_score,
        p.ic_score,
        p.process_type,
        p.number_of_sites,
        p.legacy_nameplate_capacity_mw,
        p.tech,
        p.heat_rate_btu_kwh,
        p.capacity_factor_2024,
        p.legacy_cod,
        p.gas_reference,
        p.redev_tier,
        p.redevelopment_base_case,
        p.redev_capacity_mw,
        p.redev_tech,
        p.redev_fuel,
        p.redev_heatrate_btu_kwh,
        p.redev_cod,
        p.redev_land_control,
        p.redev_stage_gate,
        p.redev_lead,
        p.redev_support,
        p.contact,
        p.iso,
        p.zone_submarket,
        p.location,
        p.site_acreage,
        p.fuel,
        p.plant_cod,
        p.capacity_factor,
        p.markets,
        p.thermal_optimization,
        p.environmental_score,
        p.market_score,
        p.infra,
        p.ix,
        p.co_locate_repower,
        p.transactability_scores,
        p.transactability,
        p.project_type,
        p.status,
        p.ma_tier,
        p.ma_tier_id,
        p.overall_score,
        p.thermal_score,
        p.redev_score,
        p.mw,
        p.hr,
        p.cf,
        p.mkt,
        p.zone,
        p.poi_voltage_kv,
        p.created_at,
        p.updated_at,
        p.created_by,
        p.updated_by,
        p.is_active,
        mt.tier_name as ma_tier_name,
        mt.color_hex as ma_tier_color
      FROM ${schema}.projects p
      LEFT JOIN ${schema}.ma_tiers mt ON p.ma_tier_id = mt.id
      WHERE p.is_active = true
    `;
    
    const values = [];
    let paramCount = 1;

    if (iso && iso !== 'All') {
      query += ` AND p.iso = $${paramCount}`;
      values.push(iso);
      paramCount++;
    }

    if (process_type && process_type !== 'All') {
      query += ` AND p.process_type = $${paramCount}`;
      values.push(process_type === 'Process' ? 'P' : 'B');
      paramCount++;
    }

    if (plant_owner && plant_owner !== 'All') {
      query += ` AND p.plant_owner = $${paramCount}`;
      values.push(plant_owner);
      paramCount++;
    }

    if (status && status !== 'All') {
      query += ` AND p.status = $${paramCount}`;
      values.push(status);
      paramCount++;
    }

    if (tech && tech !== 'All') {
      query += ` AND (p.tech ILIKE $${paramCount} OR p.redev_tech ILIKE $${paramCount})`;
      values.push(`%${tech}%`);
      paramCount++;
    }

    if (project_type && project_type !== 'All') {
      query += ` AND p.project_type ILIKE $${paramCount}`;
      values.push(`%${project_type}%`);
      paramCount++;
    }

    if (ma_tier && ma_tier !== 'All') {
      query += ` AND p.ma_tier = $${paramCount}`;
      values.push(ma_tier);
      paramCount++;
    }

    const validSortColumns = [
      'id', 'project_name', 'project_codename', 'plant_owner', 'iso', 
      'overall_score', 'thermal_score', 'redev_score', 'mw', 'hr', 'cf', 
      'status', 'ma_tier', 'redev_tier', 'redev_stage_gate', 'transactability',
      'created_at', 'updated_at', 'poi_voltage_kv'
    ];
    
    const safeSortBy = validSortColumns.includes(sort_by.toLowerCase()) 
      ? sort_by 
      : 'project_name';
    
    const safeSortOrder = sort_order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    
    query += ` ORDER BY p.${safeSortBy} ${safeSortOrder}`;
    
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(parseInt(limit), parseInt(offset));

    console.log('📊 Executing query with params:', { query: query.substring(0, 200) + '...', values });
    
    const result = await pool.query(query, values);
    console.log(`✅ Retrieved ${result.rows.length} projects`);
    
    return result.rows;
  } catch (error) {
    console.error('❌ Error in getAllProjects:', error);
    throw new Error(`Database query failed: ${error.message}`);
  }
};

const getProjectById = async (id) => {
  try {
    const schema = process.env.DB_SCHEMA || 'pipeline_dashboard';
    
    const query = `
      SELECT 
        p.*,
        mt.tier_name as ma_tier_name,
        mt.color_hex as ma_tier_color
      FROM ${schema}.projects p
      LEFT JOIN ${schema}.ma_tiers mt ON p.ma_tier_id = mt.id
      WHERE p.id = $1 AND p.is_active = true
      LIMIT 1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('❌ Error in getProjectById:', error);
    throw new Error(`Failed to fetch project: ${error.message}`);
  }
};

const getProjectByName = async (name) => {
  try {
    const schema = process.env.DB_SCHEMA || 'pipeline_dashboard';
    
    const query = `
      SELECT 
        p.*,
        mt.tier_name as ma_tier_name,
        mt.color_hex as ma_tier_color
      FROM ${schema}.projects p
      LEFT JOIN ${schema}.ma_tiers mt ON p.ma_tier_id = mt.id
      WHERE (p.project_name = $1 OR p.project_codename = $1) 
      AND p.is_active = true
      LIMIT 1
    `;
    
    const result = await pool.query(query, [name]);
    return result.rows[0];
  } catch (error) {
    console.error('❌ Error in getProjectByName:', error);
    throw new Error(`Failed to fetch project by name: ${error.message}`);
  }
};

const createProject = async (projectData) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('📥 Received project data:', projectData);
    
    const columns = [];
    const placeholders = [];
    const values = [];
    let paramCount = 1;

    const handleMaTier = (maTierValue) => {
      if (!maTierValue) return null;

      // Normalize to lowercase for case-insensitive matching
      const normalizedValue = maTierValue.toString().toLowerCase().trim();

      const maTierMap = {
        'owned': 1,
        'signed': 7,
        'exclusivity': 2,
        'second round': 3,
        'first round': 4,
        'pipeline': 5,
        'passed': 6
      };

      return maTierMap[normalizedValue] || null;
    };

    for (const [key, value] of Object.entries(projectData)) {
      if (!['id', 'mw', 'hr', 'cf', 'mkt', 'zone', 'ma_tier_id'].includes(key)) {
        if (key === 'ma_tier' || key === 'M&A Tier') {
          const maTierId = handleMaTier(value);
          if (maTierId !== null) {
            columns.push('ma_tier_id');
            placeholders.push(`$${paramCount}`);
            values.push(maTierId);
            paramCount++;
          }
          columns.push('ma_tier');
          placeholders.push(`$${paramCount}`);
          values.push(value);
          paramCount++;
        } 
        else if (key === 'poi_voltage_kv' || key === 'POI Voltage (KV)') {
          columns.push('poi_voltage_kv');
          placeholders.push(`$${paramCount}`);
          
          if (value === '' || value === null || value === undefined) {
            values.push(null);
          } else {
            values.push(value);
          }
          
          paramCount++;
        }
        else {
          columns.push(key);
          placeholders.push(`$${paramCount}`);
          
          if (value === '' || value === null || value === undefined) {
            values.push(null);
          } else {
            values.push(value);
          }
          
          paramCount++;
        }
      }
    }

    columns.push('created_at', 'updated_at', 'created_by', 'updated_by', 'is_active');
    placeholders.push('NOW()', 'NOW()', '$' + paramCount, '$' + (paramCount + 1), '$' + (paramCount + 2));
    values.push('system', 'system', true);
    paramCount += 3;

    const schema = process.env.DB_SCHEMA || 'pipeline_dashboard';
    const query = `
      INSERT INTO ${schema}.projects (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;

    console.log('📝 SQL Query:', query);
    console.log('📝 Values:', values);
    
    const result = await client.query(query, values);
    const insertedRow = result.rows[0];

    // ========== RECALCULATE SCORES ==========
    // After creating, calculate all derived and composite scores
    console.log('🔄 Recalculating scores for new project...');

    // 1. Calculate derived scores from raw values
    const derivedScores = {};

    // Market score from ISO
    if (insertedRow.iso) {
      derivedScores.markets = calculateMarketScore(insertedRow.iso);
    }

    // COD score from Legacy COD
    if (insertedRow.legacy_cod) {
      derivedScores.plant_cod = calculateCODScore(insertedRow.legacy_cod);
    }

    // Capacity factor score from capacity_factor_2024
    if (insertedRow.capacity_factor_2024 !== null && insertedRow.capacity_factor_2024 !== undefined) {
      derivedScores.capacity_factor = calculateCapacityFactorScore(insertedRow.capacity_factor_2024);
    }

    // Transactability score from transactability field (handles both numeric and text)
    const transactValue = insertedRow.transactability_scores || insertedRow.transactability;
    if (transactValue !== null && transactValue !== undefined && transactValue !== '') {
      derivedScores.transactability_scores = calculateTransactabilityScore(transactValue);
    }

    // Status from COD dates
    derivedScores.status = calculateStatus(insertedRow.legacy_cod, insertedRow.redev_cod);

    // 2. Merge derived scores into the row for composite calculation
    const rowWithDerived = { ...insertedRow, ...derivedScores };

    // 3. Calculate composite scores
    const compositeScores = calculateAllScores(rowWithDerived);

    // 4. Update the database with all calculated scores
    const scoreUpdateClauses = [];
    const scoreValues = [];
    let scoreParamCount = 1;

    if (derivedScores.markets !== null && derivedScores.markets !== undefined) {
      scoreUpdateClauses.push(`markets = $${scoreParamCount}`);
      scoreValues.push(derivedScores.markets);
      scoreParamCount++;
    }

    if (derivedScores.plant_cod !== null && derivedScores.plant_cod !== undefined) {
      scoreUpdateClauses.push(`plant_cod = $${scoreParamCount}`);
      scoreValues.push(derivedScores.plant_cod);
      scoreParamCount++;
    }

    if (derivedScores.capacity_factor !== null && derivedScores.capacity_factor !== undefined) {
      scoreUpdateClauses.push(`capacity_factor = $${scoreParamCount}`);
      scoreValues.push(derivedScores.capacity_factor);
      scoreParamCount++;
    }

    if (derivedScores.transactability_scores !== null && derivedScores.transactability_scores !== undefined) {
      scoreUpdateClauses.push(`transactability_scores = $${scoreParamCount}`);
      scoreValues.push(derivedScores.transactability_scores);
      scoreParamCount++;
    }

    if (derivedScores.status) {
      scoreUpdateClauses.push(`status = $${scoreParamCount}`);
      scoreValues.push(derivedScores.status);
      scoreParamCount++;
    }

    if (compositeScores.thermal_score !== null) {
      scoreUpdateClauses.push(`thermal_score = $${scoreParamCount}`);
      scoreValues.push(compositeScores.thermal_score);
      scoreParamCount++;
      // Also update legacy column name
      scoreUpdateClauses.push(`thermal_operating_score = $${scoreParamCount}`);
      scoreValues.push(compositeScores.thermal_score);
      scoreParamCount++;
    }

    if (compositeScores.redevelopment_score !== null) {
      scoreUpdateClauses.push(`redev_score = $${scoreParamCount}`);
      scoreValues.push(compositeScores.redevelopment_score);
      scoreParamCount++;
      // Also update legacy column name
      scoreUpdateClauses.push(`redevelopment_score = $${scoreParamCount}`);
      scoreValues.push(compositeScores.redevelopment_score);
      scoreParamCount++;
    }

    if (compositeScores.overall_score !== null) {
      scoreUpdateClauses.push(`overall_score = $${scoreParamCount}`);
      scoreValues.push(compositeScores.overall_score);
      scoreParamCount++;
      // Also update legacy column name
      scoreUpdateClauses.push(`overall_project_score = $${scoreParamCount}`);
      scoreValues.push(compositeScores.overall_score);
      scoreParamCount++;
    }

    // Only update scores if there are any to update
    let finalRow = insertedRow;
    if (scoreUpdateClauses.length > 0) {
      scoreValues.push(insertedRow.id);
      const scoreQuery = `
        UPDATE ${schema}.projects
        SET ${scoreUpdateClauses.join(', ')}
        WHERE id = $${scoreParamCount}
        RETURNING *
      `;

      console.log('📝 Score Update Query:', scoreQuery);
      console.log('📝 Score Values:', scoreValues);

      const scoreResult = await client.query(scoreQuery, scoreValues);
      finalRow = scoreResult.rows[0];

      console.log('✅ Scores calculated for new project:', {
        thermal_score: compositeScores.thermal_score,
        redev_score: compositeScores.redevelopment_score,
        overall_score: compositeScores.overall_score
      });
    }

    await client.query('COMMIT');

    console.log(`✅ Created new project: ${finalRow.project_name}`);
    return finalRow;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error in createProject:', error);
    throw new Error(`Failed to create project: ${error.message}`);
  } finally {
    client.release();
  }
};

const updateProject = async (id, updates) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const schema = process.env.DB_SCHEMA || 'pipeline_dashboard';
    const checkQuery = `SELECT id FROM ${schema}.projects WHERE id = $1 AND is_active = true`;
    const checkResult = await client.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      throw new Error('Project not found or inactive');
    }
    
    const setClauses = [];
    const values = [];
    let paramCount = 1;

    console.log('🔄 Updates received:', updates);
    
    const handleMaTier = (maTierValue) => {
      if (!maTierValue) return null;

      // Normalize to lowercase for case-insensitive matching
      const normalizedValue = maTierValue.toString().toLowerCase().trim();

      const maTierMap = {
        'owned': 1,
        'signed': 7,
        'exclusivity': 2,
        'second round': 3,
        'first round': 4,
        'pipeline': 5,
        'passed': 6
      };

      return maTierMap[normalizedValue] || null;
    };

    for (const [key, value] of Object.entries(updates)) {
      if (!['id', 'mw', 'hr', 'cf', 'mkt', 'zone'].includes(key)) {
        if (key === 'ma_tier' || key === 'M&A Tier') {
          const maTierValue = value;
          const maTierId = handleMaTier(maTierValue);
          
          setClauses.push(`ma_tier = $${paramCount}`);
          values.push(maTierValue);
          paramCount++;
          
          setClauses.push(`ma_tier_id = $${paramCount}`);
          values.push(maTierId);
          paramCount++;
        } 
        else if (key === 'status' || key === 'Status') {
          setClauses.push(`status = $${paramCount}`);
          if (value && typeof value === 'string') {
            values.push(value.charAt(0).toUpperCase() + value.slice(1).toLowerCase());
          } else {
            values.push(value);
          }
          paramCount++;
        }
        else if (key === 'poi_voltage_kv' || key === 'POI Voltage (KV)') {
          setClauses.push(`poi_voltage_kv = $${paramCount}`);

          if (value === '' || value === null || value === undefined) {
            values.push(null);
          } else {
            values.push(value);
          }

          paramCount++;
        }
        else if (key === 'transactability' || key === 'Transactability') {
          // Sync both transactability columns
          const transactValue = value === '' || value === null || value === undefined ? null : value;

          setClauses.push(`transactability = $${paramCount}`);
          values.push(transactValue);
          paramCount++;

          setClauses.push(`transactability_scores = $${paramCount}`);
          values.push(transactValue);
          paramCount++;
        }
        else if (key === 'transactability_scores' || key === 'Transactability Scores') {
          // Sync both transactability columns
          const transactValue = value === '' || value === null || value === undefined ? null : value;

          setClauses.push(`transactability_scores = $${paramCount}`);
          values.push(transactValue);
          paramCount++;

          setClauses.push(`transactability = $${paramCount}`);
          values.push(transactValue);
          paramCount++;
        }
        else {
          setClauses.push(`${key} = $${paramCount}`);
          
          if (value === '' || value === null || value === undefined) {
            values.push(null);
          } else {
            values.push(value);
          }
          
          paramCount++;
        }
      }
    }

    setClauses.push('updated_at = NOW()');
    setClauses.push(`updated_by = 'api'`);

    values.push(id);
    
    const query = `
      UPDATE ${schema}.projects
      SET ${setClauses.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    console.log('📝 Update Query:', query);
    console.log('📝 Values being sent:', values);
    
    const result = await client.query(query, values);

    const updatedRow = result.rows[0];

    // ========== RECALCULATE SCORES ==========
    // After updating raw values, recalculate all derived and composite scores
    // IMPORTANT: Always calculate scores, returning NULL when source is NULL
    // This ensures clearing a source value (e.g., legacy_cod) clears its derived score (plant_cod)
    console.log('🔄 Recalculating scores for updated project...');

    // Calculate derived scores from raw values (NULL source → NULL score)
    const derivedScores = {};

    // Market score from ISO (NULL if ISO is empty)
    derivedScores.markets = updatedRow.iso ? calculateMarketScore(updatedRow.iso) : null;

    // COD score from Legacy COD (NULL if legacy_cod is empty)
    derivedScores.plant_cod = updatedRow.legacy_cod ? calculateCODScore(updatedRow.legacy_cod) : null;

    // Capacity factor score (NULL if capacity_factor_2024 is empty)
    derivedScores.capacity_factor = (updatedRow.capacity_factor_2024 !== null && updatedRow.capacity_factor_2024 !== undefined)
      ? calculateCapacityFactorScore(updatedRow.capacity_factor_2024)
      : null;

    // Transactability score (NULL if both transactability fields are empty)
    const transactValue = updatedRow.transactability_scores || updatedRow.transactability;
    derivedScores.transactability_scores = (transactValue !== null && transactValue !== undefined && transactValue !== '')
      ? calculateTransactabilityScore(transactValue)
      : null;

    // Status from COD dates
    derivedScores.status = calculateStatus(updatedRow.legacy_cod, updatedRow.redev_cod);

    // Merge derived scores into the row for composite calculation
    const rowWithDerived = { ...updatedRow, ...derivedScores };

    // Calculate composite scores
    const compositeScores = calculateAllScores(rowWithDerived);

    // Update the calculated scores in the database
    // IMPORTANT: Always include derived scores (even NULL) to ensure clearing propagates
    const scoreUpdateClauses = [];
    const scoreValues = [];
    let scoreParamCount = 1;

    // Always update markets (can be NULL)
    scoreUpdateClauses.push(`markets = $${scoreParamCount}`);
    scoreValues.push(derivedScores.markets);
    scoreParamCount++;

    // Always update plant_cod (can be NULL)
    scoreUpdateClauses.push(`plant_cod = $${scoreParamCount}`);
    scoreValues.push(derivedScores.plant_cod);
    scoreParamCount++;

    // Always update capacity_factor (can be NULL)
    scoreUpdateClauses.push(`capacity_factor = $${scoreParamCount}`);
    scoreValues.push(derivedScores.capacity_factor);
    scoreParamCount++;

    // Always update transactability_scores (can be NULL)
    scoreUpdateClauses.push(`transactability_scores = $${scoreParamCount}`);
    scoreValues.push(derivedScores.transactability_scores);
    scoreParamCount++;

    // Always update status
    if (derivedScores.status) {
      scoreUpdateClauses.push(`status = $${scoreParamCount}`);
      scoreValues.push(derivedScores.status);
      scoreParamCount++;
    }

    // Always update composite scores (can be NULL for N/A display)
    scoreUpdateClauses.push(`thermal_score = $${scoreParamCount}`);
    scoreValues.push(compositeScores.thermal_score);
    scoreParamCount++;
    // Also update legacy column name
    scoreUpdateClauses.push(`thermal_operating_score = $${scoreParamCount}`);
    scoreValues.push(compositeScores.thermal_score);
    scoreParamCount++;

    scoreUpdateClauses.push(`redev_score = $${scoreParamCount}`);
    scoreValues.push(compositeScores.redevelopment_score);
    scoreParamCount++;
    // Also update legacy column name
    scoreUpdateClauses.push(`redevelopment_score = $${scoreParamCount}`);
    scoreValues.push(compositeScores.redevelopment_score);
    scoreParamCount++;

    scoreUpdateClauses.push(`overall_score = $${scoreParamCount}`);
    scoreValues.push(compositeScores.overall_score);
    scoreParamCount++;
    // Also update legacy column name
    scoreUpdateClauses.push(`overall_project_score = $${scoreParamCount}`);
    scoreValues.push(compositeScores.overall_score);
    scoreParamCount++;

    // Update scores in the database
    let finalRow = updatedRow;
    if (scoreUpdateClauses.length > 0) {
      scoreValues.push(id);
      const scoreQuery = `
        UPDATE ${schema}.projects
        SET ${scoreUpdateClauses.join(', ')}
        WHERE id = $${scoreParamCount}
        RETURNING *
      `;

      console.log('📝 Score Update Query:', scoreQuery);
      console.log('📝 Score Values:', scoreValues);

      const scoreResult = await client.query(scoreQuery, scoreValues);
      finalRow = scoreResult.rows[0];

      console.log('✅ Scores recalculated:', {
        thermal_score: compositeScores.thermal_score,
        redev_score: compositeScores.redevelopment_score,
        overall_score: compositeScores.overall_score
      });
    }

    await client.query('COMMIT');

    console.log(`✅ Updated project: ${finalRow.project_name}`);
    return finalRow;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error in updateProject:', error);
    throw new Error(`Failed to update project: ${error.message}`);
  } finally {
    client.release();
  }
};

const deleteProject = async (id) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const schema = process.env.DB_SCHEMA || 'pipeline_dashboard';
    const query = `
      UPDATE ${schema}.projects
      SET is_active = false, updated_at = NOW(), updated_by = 'api'
      WHERE id = $1
      RETURNING id, project_name
    `;

    const result = await client.query(query, [id]);
    
    if (result.rows.length === 0) {
      throw new Error('Project not found');
    }
    
    await client.query('COMMIT');
    
    console.log(`🗑️ Soft deleted project: ${result.rows[0].project_name}`);
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error in deleteProject:', error);
    throw new Error(`Failed to delete project: ${error.message}`);
  } finally {
    client.release();
  }
};

const getDashboardStats = async () => {
  try {
    const schema = process.env.DB_SCHEMA || 'pipeline_dashboard';
    
    const queries = {
      totalProjects: {
        text: `SELECT COUNT(*) as count FROM ${schema}.projects WHERE is_active = true`,
      },
      
      isoDistribution: {
        text: `SELECT iso, COUNT(*) as count FROM ${schema}.projects WHERE is_active = true AND iso IS NOT NULL GROUP BY iso ORDER BY count DESC`,
      },
      
      techDistribution: {
        text: `SELECT tech, COUNT(*) as count FROM ${schema}.projects WHERE is_active = true AND tech IS NOT NULL GROUP BY tech ORDER BY count DESC LIMIT 10`,
      },
      
      statusDistribution: {
        text: `SELECT status, COUNT(*) as count FROM ${schema}.projects WHERE is_active = true AND status IS NOT NULL GROUP BY status ORDER BY count DESC`,
      },
      
      maTierDistribution: {
        text: `SELECT ma_tier, COUNT(*) as count FROM ${schema}.projects WHERE is_active = true AND ma_tier IS NOT NULL GROUP BY ma_tier ORDER BY
          CASE ma_tier
            WHEN 'Owned' THEN 1
            WHEN 'Signed' THEN 2
            WHEN 'Exclusivity' THEN 3
            WHEN 'second round' THEN 4
            WHEN 'first round' THEN 5
            WHEN 'pipeline' THEN 6
            WHEN 'passed' THEN 7
            ELSE 8
          END`,
      },
      
      ownerDistribution: {
        text: `SELECT plant_owner, COUNT(*) as count FROM ${schema}.projects WHERE is_active = true AND plant_owner IS NOT NULL GROUP BY plant_owner ORDER BY count DESC LIMIT 10`,
      },
      
      poiVoltageDistribution: {
        text: `SELECT poi_voltage_kv, COUNT(*) as count FROM ${schema}.projects WHERE is_active = true AND poi_voltage_kv IS NOT NULL GROUP BY poi_voltage_kv ORDER BY count DESC LIMIT 10`,
      },
      
      scoreStats: {
        text: `SELECT 
          ROUND(AVG(CAST(NULLIF(overall_score, '') AS NUMERIC))::numeric, 2) as avg_overall,
          ROUND(AVG(CAST(NULLIF(thermal_score, '') AS NUMERIC))::numeric, 2) as avg_thermal,
          ROUND(AVG(CAST(NULLIF(redev_score, '') AS NUMERIC))::numeric, 2) as avg_redev,
          ROUND(SUM(CAST(NULLIF(mw, '') AS NUMERIC))::numeric, 2) as total_mw,
          ROUND(AVG(CAST(NULLIF(poi_voltage_kv, '') AS NUMERIC))::numeric, 2) as avg_poi_voltage,
          COUNT(*) as total_projects
        FROM ${schema}.projects WHERE is_active = true`,
      },
      
      redevDistribution: {
        text: `SELECT 
          redev_tech,
          COUNT(*) as count,
          ROUND(SUM(CAST(NULLIF(redev_capacity_mw, '') AS NUMERIC))::numeric, 2) as total_capacity
        FROM ${schema}.projects 
        WHERE is_active = true AND redev_tech IS NOT NULL
        GROUP BY redev_tech 
        ORDER BY count DESC
        LIMIT 10`,
      }
    };

    const results = {};
    
    for (const [key, query] of Object.entries(queries)) {
      try {
        const result = await pool.query(query.text);
        results[key] = result.rows;
      } catch (error) {
        console.error(`❌ Error in getDashboardStats for ${key}:`, error.message);
        results[key] = [];
      }
    }
    
    console.log('📊 Dashboard statistics retrieved successfully');
    return results;
  } catch (error) {
    console.error('❌ Error in getDashboardStats:', error);
    throw new Error(`Failed to fetch dashboard statistics: ${error.message}`);
  }
};

const getFilterOptions = async () => {
  try {
    const schema = process.env.DB_SCHEMA || 'pipeline_dashboard';
    
    const queries = {
      isos: {
        text: `SELECT DISTINCT iso as value FROM ${schema}.projects WHERE is_active = true AND iso IS NOT NULL AND iso != '' ORDER BY iso`,
      },
      
      owners: {
        text: `SELECT DISTINCT plant_owner as value FROM ${schema}.projects WHERE is_active = true AND plant_owner IS NOT NULL AND plant_owner != '' ORDER BY plant_owner`,
      },
      
      techs: {
        text: `SELECT DISTINCT tech as value FROM ${schema}.projects WHERE is_active = true AND tech IS NOT NULL AND tech != '' ORDER BY tech`,
      },
      
      statuses: {
        text: `SELECT DISTINCT status as value FROM ${schema}.projects WHERE is_active = true AND status IS NOT NULL AND status != '' ORDER BY status`,
      },
      
      maTiers: {
        text: `SELECT DISTINCT ma_tier as value FROM ${schema}.projects WHERE is_active = true AND ma_tier IS NOT NULL AND ma_tier != '' ORDER BY
          CASE ma_tier
            WHEN 'Owned' THEN 1
            WHEN 'Signed' THEN 2
            WHEN 'Exclusivity' THEN 3
            WHEN 'second round' THEN 4
            WHEN 'first round' THEN 5
            WHEN 'pipeline' THEN 6
            WHEN 'passed' THEN 7
            ELSE 8
          END`,
      },
      
      projectTypes: {
        text: `SELECT DISTINCT project_type as value FROM ${schema}.projects WHERE is_active = true AND project_type IS NOT NULL AND project_type != '' ORDER BY project_type`,
      },
      
      processTypes: {
        text: `SELECT DISTINCT process_type as value FROM ${schema}.projects WHERE is_active = true AND process_type IS NOT NULL AND process_type != '' ORDER BY process_type`,
      },
      
      poiVoltages: {
        text: `SELECT DISTINCT poi_voltage_kv as value FROM ${schema}.projects WHERE is_active = true AND poi_voltage_kv IS NOT NULL AND poi_voltage_kv != '' ORDER BY CAST(poi_voltage_kv AS NUMERIC)`,
      },
      
      maTierOptions: {
        text: `SELECT tier_name as value, color_hex FROM ${schema}.ma_tiers WHERE is_active = true ORDER BY tier_order`,
      },
      
      redevFuelOptions: {
        text: `SELECT DISTINCT fuel_name as value FROM ${schema}.redev_fuels WHERE is_active = true ORDER BY fuel_name`,
      },
      
      redevelopmentBaseOptions: {
        text: `SELECT DISTINCT base_case_name as value FROM ${schema}.redev_base_cases WHERE is_active = true ORDER BY base_case_name`,
      },
      
      redevLeadOptions: {
        text: `SELECT DISTINCT lead_name as value FROM ${schema}.redev_lead_options WHERE is_active = true ORDER BY lead_name`,
      },
      
      redevSupportOptions: {
        text: `SELECT DISTINCT support_name as value FROM ${schema}.redev_support_options WHERE is_active = true ORDER BY support_name`,
      },
      
      coLocateRepowerOptions: {
        text: `SELECT DISTINCT option_name as value FROM ${schema}.co_locate_repower_options WHERE is_active = true ORDER BY option_name`,
      }
    };

    const results = {};
    
    for (const [key, query] of Object.entries(queries)) {
      try {
        const result = await pool.query(query.text);
        
        if (key === 'maTierOptions') {
          results[key] = result.rows.map(row => ({
            value: row.value,
            color: row.color_hex
          }));
        } else {
          results[key] = result.rows.map(row => row.value);
        }
      } catch (error) {
        console.error(`❌ Error fetching ${key} options:`, error.message);
        
        if (key === 'maTierOptions') {
          results[key] = [
            { value: 'Owned', color: '#8b5cf6' },
            { value: 'Exclusivity', color: '#10b981' },
            { value: 'second round', color: '#3b82f6' },
            { value: 'first round', color: '#f59e0b' },
            { value: 'pipeline', color: '#6b7280' },
            { value: 'passed', color: '#ef4444' }
          ];
        } else if (key.includes('Options')) {
          results[key] = [];
        } else {
          results[key] = [];
        }
      }
    }
    
    console.log('🔍 Filter options retrieved successfully');
    return results;
  } catch (error) {
    console.error('❌ Error in getFilterOptions:', error);
    throw new Error(`Failed to fetch filter options: ${error.message}`);
  }
};

/**
 * Upsert a single project (INSERT or UPDATE based on project_name)
 * Uses PostgreSQL INSERT ... ON CONFLICT
 *
 * @param {Object} projectData - Project data object with column values
 * @param {string} updatedBy - User performing the update (default: 'import')
 * @returns {Object} - { action: 'inserted'|'updated', data: projectRow }
 */
const upsertProject = async (projectData, updatedBy = 'import') => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const schema = process.env.DB_SCHEMA || 'pipeline_dashboard';

    // Handle ma_tier to ma_tier_id mapping
    const handleMaTier = (maTierValue) => {
      if (!maTierValue) return null;
      const normalizedValue = maTierValue.toString().toLowerCase().trim();
      const maTierMap = {
        'owned': 1,
        'signed': 7,
        'exclusivity': 2,
        'second round': 3,
        'first round': 4,
        'pipeline': 5,
        'passed': 6
      };
      return maTierMap[normalizedValue] || null;
    };

    // Build column lists and values
    const columns = [];
    const placeholders = [];
    const updateClauses = [];
    const values = [];
    let paramCount = 1;

    // Define which columns to process
    const validColumns = [
      'project_name', 'project_codename', 'plant_owner', 'contact', 'project_type',
      'iso', 'zone_submarket', 'location', 'legacy_nameplate_capacity_mw',
      'tech', 'fuel', 'heat_rate_btu_kwh', 'legacy_cod', 'capacity_factor_2024',
      'site_acreage', 'number_of_sites', 'process_type', 'transactability_scores',
      'gas_reference', 'redevelopment_base_case', 'redev_tier', 'redev_capacity_mw',
      'redev_tech', 'redev_fuel', 'redev_heatrate_btu_kwh', 'redev_cod',
      'redev_land_control', 'redev_stage_gate', 'redev_lead', 'redev_support',
      'co_locate_repower', 'thermal_optimization', 'environmental_score',
      'market_score', 'infra', 'ix', 'ma_tier', 'poi_voltage_kv',
      // Calculated scores
      'plant_cod', 'capacity_factor', 'markets', 'fuel_score', 'capacity_size',
      'thermal_score', 'redev_score', 'overall_score', 'status',
      // Legacy columns from original import
      'overall_project_score', 'thermal_operating_score', 'redevelopment_score',
      'transactability'
    ];

    // Skip these columns (auto-managed or computed)
    const skipColumns = ['id', 'created_at', 'updated_at', 'created_by', 'updated_by',
                         'is_active', 'mw', 'hr', 'cf', 'mkt', 'zone', 'excel_row_id'];

    for (const [key, value] of Object.entries(projectData)) {
      const columnName = key.toLowerCase().replace(/[^a-z0-9_]/g, '_');

      if (skipColumns.includes(columnName)) continue;
      if (!validColumns.includes(columnName) && key !== 'ma_tier') continue;

      if (key === 'ma_tier' || columnName === 'ma_tier') {
        // Handle ma_tier specially
        const maTierId = handleMaTier(value);
        if (maTierId !== null) {
          columns.push('ma_tier_id');
          placeholders.push(`$${paramCount}`);
          updateClauses.push(`ma_tier_id = $${paramCount}`);
          values.push(maTierId);
          paramCount++;
        }
        columns.push('ma_tier');
        placeholders.push(`$${paramCount}`);
        updateClauses.push(`ma_tier = $${paramCount}`);
        values.push(value === '' || value === null ? null : value);
        paramCount++;
      } else {
        columns.push(columnName);
        placeholders.push(`$${paramCount}`);
        // Don't update project_name on conflict
        if (columnName !== 'project_name') {
          updateClauses.push(`${columnName} = $${paramCount}`);
        }
        values.push(value === '' || value === null || value === undefined ? null : value);
        paramCount++;
      }
    }

    // Add metadata columns
    columns.push('updated_at', 'updated_by', 'is_active');
    placeholders.push('NOW()', `$${paramCount}`, 'true');
    updateClauses.push('updated_at = NOW()', `updated_by = $${paramCount}`);
    values.push(updatedBy);
    paramCount++;

    // Add created_at and created_by for INSERT only
    columns.push('created_at', 'created_by');
    placeholders.push('NOW()', `$${paramCount}`);
    values.push(updatedBy);

    const query = `
      INSERT INTO ${schema}.projects (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      ON CONFLICT (project_name)
      DO UPDATE SET ${updateClauses.join(', ')}
      RETURNING *, (xmax = 0) as was_inserted
    `;

    const result = await client.query(query, values);
    await client.query('COMMIT');

    const row = result.rows[0];
    const wasInserted = row.was_inserted;
    delete row.was_inserted;

    return {
      action: wasInserted ? 'inserted' : 'updated',
      data: row
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error in upsertProject:', error);
    throw new Error(`Failed to upsert project: ${error.message}`);
  } finally {
    client.release();
  }
};

/**
 * Bulk upsert multiple projects in a transaction
 *
 * @param {Array} projects - Array of project data objects
 * @param {string} updatedBy - User performing the update
 * @returns {Object} - { inserted: count, updated: count, errors: [], projects: [] }
 */
const bulkUpsertProjects = async (projects, updatedBy = 'import') => {
  const results = {
    inserted: 0,
    updated: 0,
    errors: [],
    projects: []
  };

  for (let i = 0; i < projects.length; i++) {
    const project = projects[i];
    const projectName = project.project_name || project['Project Name'] || `Row ${i + 1}`;

    try {
      const result = await upsertProject(project, updatedBy);

      if (result.action === 'inserted') {
        results.inserted++;
      } else {
        results.updated++;
      }

      results.projects.push({
        project_name: result.data.project_name,
        action: result.action,
        id: result.data.id
      });

    } catch (error) {
      results.errors.push({
        row: i + 1,
        project_name: projectName,
        error: error.message
      });
    }

    // Log progress every 10 records
    if ((i + 1) % 10 === 0) {
      console.log(`   Processed ${i + 1}/${projects.length} projects...`);
    }
  }

  return results;
};

const getProjectsCount = async (filters = {}) => {
  try {
    const schema = process.env.DB_SCHEMA || 'pipeline_dashboard';

    let query = `SELECT COUNT(*) as total FROM ${schema}.projects WHERE is_active = true`;
    
    const values = [];
    let paramCount = 1;

    if (filters.iso && filters.iso !== 'All') {
      query += ` AND iso = $${paramCount}`;
      values.push(filters.iso);
      paramCount++;
    }

    if (filters.plant_owner && filters.plant_owner !== 'All') {
      query += ` AND plant_owner = $${paramCount}`;
      values.push(filters.plant_owner);
      paramCount++;
    }

    if (filters.ma_tier && filters.ma_tier !== 'All') {
      query += ` AND ma_tier = $${paramCount}`;
      values.push(filters.ma_tier);
      paramCount++;
    }

    const result = await pool.query(query, values);
    return parseInt(result.rows[0].total);
  } catch (error) {
    console.error('❌ Error in getProjectsCount:', error);
    throw new Error(`Failed to get projects count: ${error.message}`);
  }
};

module.exports = {
  getAllProjects,
  getProjectById,
  getProjectByName,
  createProject,
  updateProject,
  deleteProject,
  getDashboardStats,
  getFilterOptions,
  getProjectsCount,
  upsertProject,
  bulkUpsertProjects,

  testConnection: database.testConnection.bind(database)
};
