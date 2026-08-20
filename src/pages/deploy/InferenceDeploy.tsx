import { useState, useEffect } from 'react';
import {
  Card, Table, Button, Tag, Space, Typography, Modal, Form, Input, Select,
  InputNumber, Switch, message, Popconfirm, Descriptions, Row, Col, Statistic
} from 'antd';
import {
  PlusOutlined, ReloadOutlined, DeleteOutlined, EyeOutlined,
  CloudServerOutlined, CheckCircleOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';

const { Title } = Typography;

interface InferenceService {
  name: string;
  modelName: string;
  modelVersion: string;
  framework: string;
  replicas: number;
  readyReplicas: number;
  status: 'Running' | 'Pending' | 'Failed' | 'Scaling';
  cpu: string;
  memory: string;
  gpu?: string;
  url: string;
  createdAt: string;
  canaryEnabled: boolean;
  canaryTraffic?: number;
}

// 模拟数据
const mockServices: InferenceService[] = [
  {
    name: 'bert-sentiment-v1',
    modelName: 'bert-sentiment',
    modelVersion: 'v1.0.0',
    framework: 'PyTorch',
    replicas: 2,
    readyReplicas: 2,
    status: 'Running',
    cpu: '2',
    memory: '4Gi',
    gpu: '1',
    url: 'http://bert-sentiment-v1.kubeai.svc.cluster.local',
    createdAt: '2025-01-15T10:30:00Z',
    canaryEnabled: false,
  },
  {
    name: 'resnet-image-v2',
    modelName: 'resnet-50',
    modelVersion: 'v2.0.0',
    framework: 'TensorFlow',
    replicas: 3,
    readyReplicas: 2,
    status: 'Scaling',
    cpu: '4',
    memory: '8Gi',
    gpu: '1',
    url: 'http://resnet-image-v2.kubeai.svc.cluster.local',
    createdAt: '2025-01-20T14:00:00Z',
    canaryEnabled: true,
    canaryTraffic: 20,
  },
  {
    name: 'gpt2-text-v1',
    modelName: 'gpt2-small',
    modelVersion: 'v1.0.0',
    framework: 'ONNX',
    replicas: 1,
    readyReplicas: 0,
    status: 'Failed',
    cpu: '4',
    memory: '16Gi',
    gpu: '1',
    url: '',
    createdAt: '2025-01-22T09:15:00Z',
    canaryEnabled: false,
  },
];

const statusColor: Record<string, string> = {
  Running: 'success',
  Pending: 'warning',
  Failed: 'error',
  Scaling: 'processing',
};

export default function InferenceDeployPage() {
  const [services, setServices] = useState<InferenceService[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState<InferenceService | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = () => {
    setLoading(true);
    // 模拟 API 调用
    setTimeout(() => {
      setServices(mockServices);
      setLoading(false);
    }, 500);
  };

  const handleCreate = async (values: any) => {
    try {
      // 模拟创建
      const newService: InferenceService = {
        name: `${values.modelName}-${values.modelVersion}`,
        modelName: values.modelName,
        modelVersion: values.modelVersion,
        framework: values.framework,
        replicas: values.replicas,
        readyReplicas: 0,
        status: 'Pending',
        cpu: values.cpu,
        memory: values.memory,
        gpu: values.gpu,
        url: '',
        createdAt: new Date().toISOString(),
        canaryEnabled: values.canaryEnabled,
        canaryTraffic: values.canaryTraffic,
      };
      setServices([...services, newService]);
      message.success('推理服务创建成功，正在部署...');
      setCreateModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('创建失败');
    }
  };

  const handleDelete = (name: string) => {
    setServices(services.filter((s) => s.name !== name));
    message.success('推理服务已删除');
  };

  const handleViewDetail = (service: InferenceService) => {
    setSelectedService(service);
    setDetailModalVisible(true);
  };

  const columns = [
    {
      title: '服务名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <a onClick={() => handleViewDetail(services.find((s) => s.name === text)!)}>{text}</a>,
    },
    {
      title: '模型',
      key: 'model',
      render: (_: any, record: InferenceService) => (
        <div>
          <div>{record.modelName}</div>
          <Tag color="blue" style={{ marginTop: 4 }}>{record.modelVersion}</Tag>
        </div>
      ),
    },
    {
      title: '框架',
      dataIndex: 'framework',
      key: 'framework',
      render: (text: string) => <Tag>{text}</Tag>,
    },
    {
      title: '副本',
      key: 'replicas',
      render: (_: any, record: InferenceService) => (
        <span>
          {record.readyReplicas}/{record.replicas}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColor[status]} icon={status === 'Running' ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}>
          {status}
        </Tag>
      ),
    },
    {
      title: '资源',
      key: 'resources',
      render: (_: any, record: InferenceService) => (
        <div style={{ fontSize: 12 }}>
          <div>CPU: {record.cpu}</div>
          <div>内存: {record.memory}</div>
          {record.gpu && <div>GPU: {record.gpu}</div>}
        </div>
      ),
    },
    {
      title: '灰度',
      dataIndex: 'canaryEnabled',
      key: 'canary',
      render: (enabled: boolean, record: InferenceService) => (
        enabled ? <Tag color="orange">{record.canaryTraffic}%</Tag> : <Tag>-</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: InferenceService) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          <Popconfirm title="确定删除此推理服务？" onConfirm={() => handleDelete(record.name)} okText="删除" cancelText="取消">
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          <CloudServerOutlined style={{ marginRight: 8 }} />
          推理服务部署管理
        </Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchServices}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
            部署推理服务
          </Button>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic title="总服务数" value={services.length} prefix={<CloudServerOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="运行中" value={services.filter((s) => s.status === 'Running').length} valueStyle={{ color: '#3f8600' }} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="异常" value={services.filter((s) => s.status === 'Failed').length} valueStyle={{ color: '#cf1322' }} prefix={<ExclamationCircleOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="总副本数" value={services.reduce((sum, s) => sum + s.replicas, 0)} />
          </Card>
        </Col>
      </Row>

      <Card>
        <Table columns={columns} dataSource={services} rowKey="name" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      {/* 创建推理服务模态框 */}
      <Modal
        title="部署推理服务"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="modelName" label="模型名称" rules={[{ required: true }]}>
                <Input placeholder="例如: bert-sentiment" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="modelVersion" label="模型版本" rules={[{ required: true }]}>
                <Input placeholder="例如: v1.0.0" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="framework" label="推理框架" rules={[{ required: true }]}>
                <Select
                  placeholder="选择框架"
                  options={[
                    { label: 'PyTorch', value: 'PyTorch' },
                    { label: 'TensorFlow', value: 'TensorFlow' },
                    { label: 'ONNX Runtime', value: 'ONNX' },
                    { label: 'Triton', value: 'Triton' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="replicas" label="副本数" initialValue={1}>
                <InputNumber min={1} max={10} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="cpu" label="CPU 请求" initialValue="2">
                <Input placeholder="例如: 2, 4" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="memory" label="内存请求" initialValue="4Gi">
                <Input placeholder="例如: 4Gi, 8Gi" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="gpu" label="GPU 数量">
                <Input placeholder="例如: 1, 2 (留空则不使用GPU)" />
              </Form.Item>
            </Col>
          </Row>
          <Divider orientation="left">灰度发布配置（可选）</Divider>
          <Form.Item name="canaryEnabled" label="启用灰度发布" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.canaryEnabled !== cur.canaryEnabled}>
            {({ getFieldValue }) =>
              getFieldValue('canaryEnabled') ? (
                <Form.Item name="canaryTraffic" label="灰度流量比例 (%)" initialValue={10}>
                  <InputNumber min={1} max={99} style={{ width: '100%' }} />
                </Form.Item>
              ) : null
            }
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                部署
              </Button>
              <Button onClick={() => setCreateModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 服务详情模态框 */}
      <Modal
        title="推理服务详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={700}
      >
        {selectedService && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="服务名称" span={2}>{selectedService.name}</Descriptions.Item>
            <Descriptions.Item label="模型名称">{selectedService.modelName}</Descriptions.Item>
            <Descriptions.Item label="模型版本">{selectedService.modelVersion}</Descriptions.Item>
            <Descriptions.Item label="框架">{selectedService.framework}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusColor[selectedService.status]}>{selectedService.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="副本数">{selectedService.readyReplicas}/{selectedService.replicas}</Descriptions.Item>
            <Descriptions.Item label="CPU">{selectedService.cpu}</Descriptions.Item>
            <Descriptions.Item label="内存">{selectedService.memory}</Descriptions.Item>
            <Descriptions.Item label="GPU">{selectedService.gpu || '-'}</Descriptions.Item>
            <Descriptions.Item label="访问地址" span={2}>
              {selectedService.url || <span style={{ color: '#999' }}>未分配</span>}
            </Descriptions.Item>
            <Descriptions.Item label="灰度发布">{selectedService.canaryEnabled ? `已启用 (${selectedService.canaryTraffic}%)` : '未启用'}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{new Date(selectedService.createdAt).toLocaleString()}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
