import apiClient from './axios';

// 推理服务管理 API

export interface InferenceService {
  name: string;
  model_name: string;
  model_version: string;
  image: string;
  replicas: number;
  ready_replicas: number;
  status: string;
  cpu: string;
  memory: string;
  gpu: string;
  url: string;
  canary_enabled: boolean;
  canary_traffic: number;
  created_at: string;
}

export interface CreateInferenceServiceRequest {
  name: string;
  model_name: string;
  model_version: string;
  image?: string;
  replicas: number;
  port?: number;
  cpu: string;
  memory: string;
  gpu?: string;
  canary_enabled?: boolean;
  canary_traffic?: number;
  enable_autoscaling?: boolean;
  max_replicas?: number;
}

export interface InferenceServiceListResponse {
  code: number;
  message: string;
  data: {
    total: number;
    items: InferenceService[];
  };
}

export interface InferenceServiceDetailResponse {
  code: number;
  message: string;
  data: InferenceService;
}

// 任务日志 API

export interface TaskLogsResponse {
  code: number;
  message: string;
  data: {
    task_id: string;
    pod_name: string;
    logs: string[];
    timestamp: string;
  };
}

export interface TaskPod {
  name: string;
  status: string;
  node_name: string;
  created_at: string;
}

export interface TaskPodsResponse {
  code: number;
  message: string;
  data: {
    task_id: string;
    pods: TaskPod[];
    total: number;
  };
}

export interface UpdateInferenceServiceRequest {
  replicas?: number;
  image?: string;
  cpu?: string;
  memory?: string;
  gpu?: string;
  canary_enabled?: boolean;
  canary_traffic?: number;
}

export const inferenceApi = {
  // 推理服务管理
  listServices: () =>
    apiClient.get<InferenceServiceListResponse>('/inference/services'),

  getService: (name: string) =>
    apiClient.get<InferenceServiceDetailResponse>(`/inference/services/${name}`),

  createService: (data: CreateInferenceServiceRequest) =>
    apiClient.post<InferenceServiceDetailResponse>('/inference/services', data),

  updateService: (name: string, data: UpdateInferenceServiceRequest) =>
    apiClient.patch<InferenceServiceDetailResponse>(`/inference/services/${name}`, data),

  deleteService: (name: string) =>
    apiClient.delete(`/inference/services/${name}`),

  // 任务日志
  getTaskLogs: (taskId: string, tailLines?: number, container?: string) => {
    const params = new URLSearchParams();
    if (tailLines) params.append('tail_lines', String(tailLines));
    if (container) params.append('container', container);
    const query = params.toString();
    return apiClient.get<TaskLogsResponse>(
      `/inference/tasks/${taskId}/logs${query ? `?${query}` : ''}`
    );
  },

  listTaskPods: (taskId: string) =>
    apiClient.get<TaskPodsResponse>(`/inference/tasks/${taskId}/pods`),
};
