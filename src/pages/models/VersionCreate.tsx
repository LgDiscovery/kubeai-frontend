import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Input, Select, Button, Typography, message, Upload, Progress } from 'antd';
import { ArrowLeftOutlined, UploadOutlined, InboxOutlined } from '@ant-design/icons';
import { modelsApi } from '../../api/models';
import type { UploadFile, UploadProps } from 'antd';

const { Title } = Typography;
const { Dragger } = Upload;

export default function VersionCreatePage() {
  const { name } = useParams<{ name: string }>();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const uploadProps: UploadProps = {
    fileList,
    maxCount: 1,
    beforeUpload: (file) => {
      // 检查文件大小（最大 2GB）
      const isLt2G = file.size / 1024 / 1024 / 1024 < 2;
      if (!isLt2G) {
        message.error('模型文件大小不能超过 2GB');
        return Upload.LIST_IGNORE;
      }
      setFileList([file]);
      return false; // 阻止自动上传，手动提交
    },
    onRemove: () => {
      setFileList([]);
    },
    accept: '.onnx,.pt,.pth,.pb,.h5,.model,.bin,.safetensors,.zip,.tar,.tar.gz',
  };

  const onFinish = async (values: {
    version: string;
    description?: string;
    framework?: string;
    framework_version?: string;
    metrics?: string;
    parameters?: string;
  }) => {
    if (!name) return;
    if (fileList.length === 0) {
      message.error('请上传模型文件');
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await modelsApi.createVersion(name, {
        ...values,
        name,
        file: fileList[0] as File,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);
      message.success('版本创建成功，模型文件已上传');
      setTimeout(() => {
        navigate(`/models/${name}`);
      }, 500);
    } catch (error) {
      // 错误已在拦截器中处理
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/models/${name}`)} style={{ marginBottom: 16 }}>
        返回详情
      </Button>
      <Title level={4}>为模型 "{name}" 添加版本</Title>
      <Card style={{ maxWidth: 700 }}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="version" label="版本号" rules={[{ required: true, message: '请输入版本号' }]}>
            <Input placeholder="例如: v1.0.0, 2.0.1" />
          </Form.Item>

          <Form.Item name="description" label="版本描述">
            <Input.TextArea rows={2} placeholder="描述此版本的变更内容" />
          </Form.Item>

          <Form.Item label="模型文件" required>
            <Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽模型文件到此区域上传</p>
              <p className="ant-upload-hint">
                支持 ONNX、PyTorch、TensorFlow 等格式，单文件最大 2GB
              </p>
            </Dragger>
            {fileList.length > 0 && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                已选择: {fileList[0].name} ({(fileList[0].size / 1024 / 1024).toFixed(2)} MB)
              </div>
            )}
          </Form.Item>

          {loading && uploadProgress > 0 && (
            <Form.Item>
              <Progress percent={uploadProgress} status="active" />
            </Form.Item>
          )}

          <Form.Item name="framework" label="框架">
            <Select
              placeholder="选择框架"
              options={[
                { label: 'PyTorch', value: 'PyTorch' },
                { label: 'TensorFlow', value: 'TensorFlow' },
                { label: 'ONNX', value: 'ONNX' },
                { label: 'Scikit-learn', value: 'Scikit-learn' },
                { label: 'XGBoost', value: 'XGBoost' },
                { label: '其他', value: 'Other' },
              ]}
            />
          </Form.Item>

          <Form.Item name="framework_version" label="框架版本">
            <Input placeholder="例如: 2.1.0, 1.14.0" />
          </Form.Item>

          <Form.Item name="metrics" label="评估指标 (JSON)">
            <Input.TextArea rows={2} placeholder='{"accuracy": 0.95, "loss": 0.12, "f1_score": 0.93}' />
          </Form.Item>

          <Form.Item name="parameters" label="超参数 (JSON)">
            <Input.TextArea rows={2} placeholder='{"learning_rate": 0.001, "batch_size": 32, "epochs": 100}' />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} icon={<UploadOutlined />}>
              上传并创建版本
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
