/**
 * Observability Configuration
 *
 * Environment-aware config that works in:
 * - Local dev (Docker Compose)
 * - Kubernetes (AWS EKS)
 * - Managed observability (Grafana Cloud, etc.)
 */

export interface ObservabilityConfig {
  serviceName: string;
  serviceVersion: string;
  environment: 'development' | 'staging' | 'production' | 'test';
  
  // OpenTelemetry Collector endpoint
  otlpEndpoint: string;
  
  // Sampling configuration
  traceSampleRate: number;
  
  // Enable/disable specific signals
  enableTracing: boolean;
  enableMetrics: boolean;
  enableLogging: boolean;
  
  // Debug mode (verbose logging)
  debug: boolean;
  
  // K8s specific
  namespace?: string;
  podName?: string;
  nodeName?: string;
}

/**
 * Get observability configuration from environment variables
 * Works seamlessly in local Docker and Kubernetes environments
 */
export function getObservabilityConfig(): ObservabilityConfig {
  const env = (process.env.NODE_ENV || 'development') as ObservabilityConfig['environment'];
  
  // Service identification
  const serviceName = process.env.OTEL_SERVICE_NAME || process.env.SERVICE_NAME || 'unknown-service';
  const serviceVersion = process.env.OTEL_SERVICE_VERSION || process.env.npm_package_version || '1.0.0';
  
  // OTLP endpoint detection:
  // 1. Explicit OTEL_EXPORTER_OTLP_ENDPOINT (K8s ConfigMap)
  // 2. Separate protocol endpoints
  // 3. Fallback to localhost for dev
  const otlpEndpoint = 
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
    process.env.OTEL_EXPORTER_OTLP_HTTP_ENDPOINT ||
    (env === 'production' ? '' : 'http://localhost:4318');
  
  // Sampling rates based on environment
  const traceSampleRate = parseFloat(
    process.env.OTEL_TRACE_SAMPLE_RATE || 
    (env === 'production' ? '0.1' : env === 'staging' ? '0.5' : '1.0')
  );
  
  // Feature flags
  const enableTracing = process.env.OTEL_ENABLE_TRACING !== 'false';
  const enableMetrics = process.env.OTEL_ENABLE_METRICS !== 'false';
  const enableLogging = process.env.OTEL_ENABLE_LOGGING !== 'false';
  
  // Debug mode
  const debug = process.env.OTEL_DEBUG === 'true' || env === 'development';
  
  // Kubernetes-specific attributes (auto-detected)
  const namespace = process.env.KUBERNETES_NAMESPACE || process.env.K8S_NAMESPACE;
  const podName = process.env.HOSTNAME || process.env.K8S_POD_NAME;
  const nodeName = process.env.K8S_NODE_NAME;
  
  return {
    serviceName,
    serviceVersion,
    environment: env,
    otlpEndpoint,
    traceSampleRate,
    enableTracing,
    enableMetrics,
    enableLogging,
    debug,
    namespace,
    podName,
    nodeName,
  };
}

/**
 * Validate configuration
 * Throws if critical settings are missing in production
 */
export function validateConfig(config: ObservabilityConfig): void {
  if (config.environment === 'production') {
    if (!config.otlpEndpoint) {
      throw new Error(
        'OTEL_EXPORTER_OTLP_ENDPOINT is required in production. ' +
        'Set it in your Kubernetes ConfigMap or environment variables.'
      );
    }
    
    if (config.serviceName === 'unknown-service') {
      throw new Error(
        'OTEL_SERVICE_NAME is required in production. ' +
        'Set it to identify your service (e.g., "appname-api").'
      );
    }
  }
  
  // Warn if OTLP endpoint is not set in staging
  if (config.environment === 'staging' && !config.otlpEndpoint) {
    console.warn(
      '[Observability] OTEL_EXPORTER_OTLP_ENDPOINT not set in staging. ' +
      'Telemetry will not be exported.'
    );
  }
}

/**
 * Get resource attributes for OpenTelemetry
 * Includes service info + K8s attributes
 */
export function getResourceAttributes(config: ObservabilityConfig): Record<string, string> {
  const attributes: Record<string, string> = {
    'service.name': config.serviceName,
    'service.version': config.serviceVersion,
    'deployment.environment': config.environment,
  };
  
  // Add K8s attributes if available
  if (config.namespace) {
    attributes['k8s.namespace.name'] = config.namespace;
  }
  
  if (config.podName) {
    attributes['k8s.pod.name'] = config.podName;
    attributes['service.instance.id'] = config.podName;
  }
  
  if (config.nodeName) {
    attributes['k8s.node.name'] = config.nodeName;
  }
  
  // Add container ID if available (Docker/K8s)
  const containerId = process.env.HOSTNAME;
  if (containerId && containerId.length === 12) {
    attributes['container.id'] = containerId;
  }
  
  return attributes;
}

