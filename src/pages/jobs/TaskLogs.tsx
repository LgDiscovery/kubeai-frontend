import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Card, Button, Typography, Space, Tag, Select, Input, message,
  Empty, Spin, Alert
} from 'antd';
import {
  ArrowLeftOutlined, ReloadOutlined, DownloadOutlined,
  PlayCircleOutlined, PauseCircleOutlined, FileTextOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

interface LogLine {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
}

// 模拟日志数据
const generateMockLogs = (taskId: string, lines: number = 100): LogLine[] => {
  const levels: LogLine['level'][] = ['INFO', 'INFO', 'INFO', 'DEBUG', 'WARN', 'ERROR'];
  const messages = [
    'Starting training process...',
    'Loading dataset from /data/train',
    'Dataset loaded: 10000 samples',
    'Initializing model: bert-base-uncased',
    'Model loaded successfully',
    'Training on GPU: NVIDIA A100',
    'Epoch 1/10 started',
    'Batch 100/500 - loss: 0.5234 - accuracy: 0.8123',
    'Batch 200/500 - loss: 0.4123 - accuracy: 0.8567',
    'Batch 300/500 - loss: 0.3567 - accuracy: 0.8891',
    'Batch 400/500 - loss: 0.3123 - accuracy: 0.9012',
    'Batch 500/500 - loss: 0.2891 - accuracy: 0.9156',
    'Epoch 1 completed - avg_loss: 0.3789 - avg_accuracy: 0.8750',
    'Validation started...',
    'Validation completed - val_loss: 0.3456 - val_accuracy: 0.8923',
    'Epoch 2/10 started',
    'Learning rate adjusted: 0.0005 -> 0.0003',
    'Saving checkpoint: model_epoch_2.pt',
    'Checkpoint saved successfully',
  ];

  const logs: LogLine[] = [];
  const now = new Date();
  for (let i = 0; i < lines; i++) {
    const timestamp = new Date(now.getTime() - (lines - i) * 1000).toISOString();
    const level = levels[Math.floor(Math.random() * levels.length)];
    const message = messages[Math.floor(Math.random() * messages.length)];
    logs.push({ timestamp, level, message });
  }
  return logs;
};

const levelColor: Record<string, string> = {
  INFO: 'blue',
  WARN: 'orange',
  ERROR: 'red',
  DEBUG: 'gray',
};

export default function TaskLogsPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [tailLines, setTailLines] = useState(200);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const autoRefreshRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchLogs();
    return () => {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
      }
    };
  }, [taskId]);

  useEffect(() => {
    if (autoRefresh) {
      autoRefreshRef.current = setInterval(() => {
        fetchLogs(true);
      }, 3000);
    } else {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
      }
    }
    return () => {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
      }
    };
  }, [autoRefresh]);

  useEffect(() => {
    // 自动滚动到底部
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const fetchLogs = (silent = false) => {
    if (!silent) setLoading(true);
    // 模拟 API 调用
    setTimeout(() => {
      const newLogs = generateMockLogs(taskId || 'unknown', tailLines);
      setLogs(newLogs);
      if (!silent) setLoading(false);
    }, 300);
  };

  const handleDownload = () => {
    const logText = logs
      .map((log) => `[${log.timestamp}] [${log.level}] ${log.message}`)
      .join('\n');
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `task_${taskId}_logs.txt`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('日志已下载');
  };

  const filteredLogs = logs.filter((log) => {
    if (filterLevel !== 'all' && log.level !== filterLevel) return false;
    if (searchText && !log.message.toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            返回
          </Button>
          <Title level={4} style={{ margin: 0 }}>
            <FileTextOutlined style={{ marginRight: 8 }} />
            任务日志 - {taskId}
          </Title>
        </Space>
        <Space>
          <Tag color="blue">Pod: training-{taskId}-0</Tag>
          <Tag color="green">Running</Tag>
        </Space>
      </div>

      <Alert
        message="实时日志查看"
        description="支持自动刷新、日志过滤和搜索。日志来自 Kubernetes Pod 标准输出。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Card
        title="日志输出"
        extra={
          <Space>
            <Select
              value={filterLevel}
              onChange={setFilterLevel}
              style={{ width: 100 }}
              options={[
                { label: '全部', value: 'all' },
                { label: 'INFO', value: 'INFO' },
                { label: 'WARN', value: 'WARN' },
                { label: 'ERROR', value: 'ERROR' },
                { label: 'DEBUG', value: 'DEBUG' },
              ]}
            />
            <Input.Search
              placeholder="搜索日志..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
            <Select
              value={tailLines}
              onChange={setTailLines}
              style={{ width: 120 }}
              options={[
                { label: '最近 100 行', value: 100 },
                { label: '最近 200 行', value: 200 },
                { label: '最近 500 行', value: 500 },
                { label: '最近 1000 行', value: 1000 },
              ]}
            />
            <Button
              icon={autoRefresh ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={() => setAutoRefresh(!autoRefresh)}
              type={autoRefresh ? 'primary' : 'default'}
            >
              {autoRefresh ? '暂停' : '自动刷新'}
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => fetchLogs()}>
              刷新
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleDownload}>
              下载
            </Button>
          </Space>
        }
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin tip="加载日志中..." />
          </div>
        ) : filteredLogs.length === 0 ? (
          <Empty description="暂无日志" />
        ) : (
          <div
            ref={logContainerRef}
            style={{
              height: 'calc(100vh - 350px)',
              overflowY: 'auto',
              background: '#1e1e1e',
              padding: 16,
              borderRadius: 4,
              fontFamily: 'Consolas, Monaco, monospace',
              fontSize: 12,
              lineHeight: 1.6,
            }}
          >
            {filteredLogs.map((log, index) => (
              <div key={index} style={{ display: 'flex', gap: 8, marginBottom: 2 }}>
                <Text style={{ color: '#888', minWidth: 180 }}>{log.timestamp}</Text>
                <Tag color={levelColor[log.level]} style={{ minWidth: 60, textAlign: 'center' }}>
                  {log.level}
                </Tag>
                <Text style={{ color: log.level === 'ERROR' ? '#ff6b6b' : log.level === 'WARN' ? '#ffd93d' : '#d4d4d4' }}>
                  {log.message}
                </Text>
              </div>
            ))}
          </div>
        )}
        <div style={{ marginTop: 8, textAlign: 'right', color: '#999', fontSize: 12 }}>
          共 {filteredLogs.length} 条日志 {autoRefresh && <Tag color="processing">自动刷新中</Tag>}
        </div>
      </Card>
    </div>
  );
}
