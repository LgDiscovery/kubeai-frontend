import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Button, Typography, Space, Tag, Select, Input, message,
  Empty, Spin, Alert
} from 'antd';
import {
  ArrowLeftOutlined, ReloadOutlined, DownloadOutlined,
  PlayCircleOutlined, PauseCircleOutlined, FileTextOutlined
} from '@ant-design/icons';
import { inferenceApi } from '../../api/inference';

const { Title, Text } = Typography;

export default function TaskLogsPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [tailLines, setTailLines] = useState(200);
  const [podName, setPodName] = useState('');
  const logContainerRef = useRef<HTMLDivElement>(null);
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLogs = useCallback(async (silent = false) => {
    if (!taskId) return;
    if (!silent) setLoading(true);
    try {
      const res = await inferenceApi.getTaskLogs(taskId, tailLines);
      setLogs(res.data.data.logs);
      setPodName(res.data.data.pod_name);
    } catch (error) {
      // 错误已在拦截器处理
    } finally {
      if (!silent) setLoading(false);
    }
  }, [taskId, tailLines]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

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
  }, [autoRefresh, fetchLogs]);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleDownload = () => {
    const logText = logs.join('\n');
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `task_${taskId}_logs.txt`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('日志已下载');
  };

  // 简单的日志级别过滤
  const filteredLogs = logs.filter((log) => {
    if (filterLevel !== 'all') {
      const upperLog = log.toUpperCase();
      if (!upperLog.includes(filterLevel)) return false;
    }
    if (searchText && !log.toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>返回</Button>
          <Title level={4} style={{ margin: 0 }}>
            <FileTextOutlined style={{ marginRight: 8 }} />
            任务日志 - {taskId}
          </Title>
        </Space>
        <Space>
          {podName && <Tag color="blue">Pod: {podName}</Tag>}
        </Space>
      </div>

      <Alert
        message="实时日志查看"
        description="通过 Kubernetes API 获取 Pod 标准输出日志，支持自动刷新、过滤和搜索。"
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
              onChange={(val) => { setTailLines(val); }}
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
            <Button icon={<ReloadOutlined />} onClick={() => fetchLogs()}>刷新</Button>
            <Button icon={<DownloadOutlined />} onClick={handleDownload}>下载</Button>
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
            {filteredLogs.map((log, index) => {
              let color = '#d4d4d4';
              if (log.toUpperCase().includes('ERROR')) color = '#ff6b6b';
              else if (log.toUpperCase().includes('WARN')) color = '#ffd93d';
              else if (log.toUpperCase().includes('DEBUG')) color = '#888';
              return (
                <div key={index} style={{ display: 'flex', gap: 8, marginBottom: 2 }}>
                  <Text style={{ color }}>{log}</Text>
                </div>
              );
            })}
          </div>
        )}
        <div style={{ marginTop: 8, textAlign: 'right', color: '#999', fontSize: 12 }}>
          共 {filteredLogs.length} 条日志 {autoRefresh && <Tag color="processing">自动刷新中</Tag>}
        </div>
      </Card>
    </div>
  );
}
