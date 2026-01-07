-- =============================================================================
-- PostgreSQL Initialization Script
-- Enable pg_stat_statements extension for monitoring query performance
-- =============================================================================
--
-- This script is automatically executed when PostgreSQL container starts
-- for the first time (if the data volume is empty).
--
-- pg_stat_statements provides query execution statistics which are used by:
-- - postgres-exporter for Prometheus metrics
-- - Grafana dashboards for query performance monitoring
--
-- =============================================================================

-- Enable pg_stat_statements extension
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Verify installation
SELECT 'pg_stat_statements extension installed successfully' AS status;

