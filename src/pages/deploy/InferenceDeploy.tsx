import { useState, useEffect } from 'react';
import {
  Card, Table, Button, Tag, Space, Typography, Modal, Form, Input, Select,
  InputNumber, Switch, message, Popconfirm, Descriptions, Row, Col, Statistic
} from 'antd';
import {
  PlusOutlined, ReloadOutlined, DeleteOutlined, EyeOutlined, EditOutlined,
  CloudServerOutlined, CheckCircleOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import { inferenceApi, type InferenceService, type CreateInferenceServiceRequest, type UpdateInferenceServiceRequest } from '../../api/inference';

const { Title } = Typography;

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
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState<InferenceService | null>(null);
  const [form] = Form.useForm();
  const [updateForm] = Form.useForm();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await inferenceApi.listServices();
      setServices(res.data.data.items);
    } catch (error) {
      // 错误已在拦截器处理
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: any) => {
    try {
      const req: CreateInferenceServiceRequest = {
        name: values.name,
        model_name: values.modelName,
        model_version: values.modelVersion,
        image: values.image,
        replicas: values.replicas,
        port: values.port,
        cpu: values.cpu,
        memory: values.memory,
        gpu: values.gpu,
        canary_enabled: values.canaryEnabled,
        canary_traffic: values.canaryTraffic,
        enable_autoscaling: values.enableAutoscaling,
        max_replicas: values.maxReplicas,
      };
      await inferenceApi.createService(req);
      message.success('推理服务创建成功');
      setCreateModalVisible(false);
      form.resetFields();
      fetchServices();
    } catch (error) {
      // 错误已在拦截器处理
    }
  };

  const handleDelete = async (name: string) => {
    try {
      await inferenceApi.deleteService(name);
      message.success('推理服务已删除');
      fetchServices();
    } catch (error) {
      // 错误已在拦截器处理
    }
  };

  const handleOpenUpdate = (service: InferenceService) => {
    setSelectedService(service);
    updateForm.setFieldsValue({
      replicas: service.replicas,
      image: service.image,
      cpu: service.cpu,
      memory: service.memory,
      gpu: service.gpu,
      canaryEnabled: service.canary_enabled,
      canaryTraffic: service.canary_traffic,
    });
    setUpdateModalVisible(true);
  };

  const handleUpdate = async (values: any) => {
    if (!selectedService) return;
    try {
      const req: UpdateInferenceServiceRequest = {
        replicas: values.replicas,
        image: values.image,
        cpu: values.cpu,
        memory: values.memory,
        gpu: values.gpu,
        canary_enabled: values.canaryEnabled,
        canary_traffic: values.canaryTraffic,
      };
      await inferenceApi.updateService(selectedService.name, req);
      message.success('推理服务更新成功');
      setUpdateModalVisible(false);
      fetchServices();
    } catch (error) {
      // 错误已在拦截器处理
    }
  };

  const handleViewDetail = async (service: InferenceService) => {
    try {
      const res = await inferenceApi.getService(service.name);
      setSelectedService(res.data.data);
      setDetailModalVisible(true);
    } catch (error) {
      setSelectedService(service);
      setDetailModalVisible(true);
    }
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
          <div>{record.model_name}</div>
          <Tag color="blue" style={{ marginTop: 4 }}>{record.model_version}</Tag>
        </div>
      ),
    },
    {
      title: '副本',
      key: 'replicas',
      render: (_: any, record: InferenceService) => (
        <span>{record.ready_replicas}/{record.replicas}</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColor[status] || 'default'} icon={status === 'Running' ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}>
          {status || 'Unknown'}
        </Tag>
      ),
    },
    {
      title: '资源',
      key: 'resources',
      render: (_: any, record: InferenceService) => (
        <div style={{ fontSize: 12 }}>
          <div>CPU: {record.cpu || '-'}</div>
          <div>内存: {record.memory || '-'}</div>
          {record.gpu && <div>GPU: {record.gpu}</div>}
        </div>
      ),
    },
    {
      title: '灰度',
      key: 'canary',
      render: (_: any, record: InferenceService) => (
        record.canary_enabled ? <Tag color="orange">{record.canary_traffic}%</Tag> : <Tag>-</Tag>
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
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleOpenUpdate(record)}>
            更新
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
          <Card><Statistic title="总服务数" value={services.length} prefix={<CloudServerOutlined />} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="运行中" value={services.filter((s) => s.status === 'Running').length} valueStyle={{ color: '#3f8600' }} prefix={<CheckCircleOutlined />} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="异常" value={services.filter((s) => s.status === 'Failed').length} valueStyle={{ color: '#cf1322' }} prefix={<ExclamationCircleOutlined />} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="总副本数" value={services.reduce((sum, s) => sum + s.replicas, 0)} /></Card>
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
              <Form.Item name="name" label="服务名称" rules={[{ required: true, message: '请输入服务名称' }]}>
                <Input placeholder="例如: bert-sentiment-v1" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="image" label="镜像地址（可选）">
                <Input placeholder="自定义推理镜像，留空使用默认" />
              </Form.Item>
            </Col>
          </Row>
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
            <Col span={8}>
              <Form.Item name="replicas" label="副本数" initialValue={1} rules={[{ required: true }]}>
                <InputNumber min={1} max={20} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="port" label="服务端口" initialValue={8501}>
                <InputNumber min={1} max={65535} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="gpu" label="GPU 数量">
                <Input placeholder="例如: 1 (留空则不使用GPU)" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="cpu" label="CPU 请求" initialValue="2" rules={[{ required: true }]}>
                <Input placeholder="例如: 2, 4" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="memory" label="内存请求" initialValue="4Gi" rules={[{ required: true }]}>
                <Input placeholder="例如: 4Gi, 8Gi" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="enableAutoscaling" label="启用自动扩缩容" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.enableAutoscaling !== cur.enableAutoscaling}>
            {({ getFieldValue }) =>
              getFieldValue('enableAutoscaling') ? (
                <Form.Item name="maxReplicas" label="最大副本数" initialValue={5}>
                  <InputNumber min={1} max={50} style={{ width: '100%' }} />
                </Form.Item>
              ) : null
            }
          </Form.Item>
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
              <Button type="primary" htmlType="submit">部署</Button>
              <Button onClick={() => setCreateModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 更新/扩缩容模态框 */}
      <Modal
        title="更新推理服务 / 扩缩容"
        open={updateModalVisible}
        onCancel={() => setUpdateModalVisible(false)}
        footer={null}
        width={600}
      >
        <Alert
          message="扩缩容提示"
          description="修改副本数将触发 K8s 滚动更新，服务可能短暂不可用。"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Form form={updateForm} layout="vertical" onFinish={handleUpdate}>
          <Form.Item name="replicas" label="副本数（扩缩容）" rules={[{ required: true }]}>
            <InputNumber min={0} max={50} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="image" label="镜像地址（更新镜像）">
            <Input placeholder="留空则不更新镜像" />
          </Form.Item>
          <Divider orientation="left">资源配置（留空则不更新）</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="cpu" label="CPU">
                <Input placeholder="例如: 2, 4" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="memory" label="内存">
                <Input placeholder="例如: 4Gi, 8Gi" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="gpu" label="GPU">
                <Input placeholder="例如: 1" />
              </Form.Item>
            </Col>
          </Row>
          <Divider orientation="left">灰度发布配置</Divider>
          <Form.Item name="canaryEnabled" label="启用灰度发布" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.canaryEnabled !== cur.canaryEnabled}>
            {({ getFieldValue }) =>
              getFieldValue('canaryEnabled') ? (
                <Form.Item name="canaryTraffic" label="灰度流量比例 (%)">
                  <InputNumber min={1} max={99} style={{ width: '100%' }} />
                </Form.Item>
              ) : null
            }
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">确认更新</Button>
              <Button onClick={() => setUpdateModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 服务详情模态框 */}
      <Modal
        title="推理服务详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[<Button key="close" onClick={() => setDetailModalVisible(false)}>关闭</Button>]}
        width={700}
      >
        {selectedService && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="服务名称" span={2}>{selectedService.name}</Descriptions.Item>
            <Descriptions.Item label="模型名称">{selectedService.model_name}</Descriptions.Item>
            <Descriptions.Item label="模型版本">{selectedService.model_version}</Descriptions.Item>
            <Descriptions.Item label="镜像">{selectedService.image || '-'}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusColor[selectedService.status] || 'default'}>{selectedService.status || 'Unknown'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="副本数">{selectedService.ready_replicas}/{selectedService.replicas}</Descriptions.Item>
            <Descriptions.Item label="CPU">{selectedService.cpu || '-'}</Descriptions.Item>
            <Descriptions.Item label="内存">{selectedService.memory || '-'}</Descriptions.Item>
            <Descriptions.Item label="GPU">{selectedService.gpu || '-'}</Descriptions.Item>
            <Descriptions.Item label="访问地址" span={2}>
              {selectedService.url || <span style={{ color: '#999' }}>未分配</span>}
            </Descriptions.Item>
            <Descriptions.Item label="灰度发布">{selectedService.canary_enabled ? `已启用 (${selectedService.canary_traffic}%)` : '未启用'}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{new Date(selectedService.created_at).toLocaleString()}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
