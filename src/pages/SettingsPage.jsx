import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Space, Typography, Alert } from 'antd';
import { ApiOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import chromaApi from '../api/chromaApi';

const { Title, Text } = Typography;

function SettingsPage() {
  const navigate = useNavigate();
  const { token, baseUrl, connected, loading, error, login, setServerUrl, checkConnection, identity } = useAuth();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    form.setFieldsValue({ 
      token: token,
      serverUrl: baseUrl || 'http://192.168.0.101:8000'
    });
  }, [token, baseUrl]);

  // Redirect to home when connected
  useEffect(() => {
    if (connected && !saving) {
      navigate('/', { replace: true });
    }
  }, [connected, saving, navigate]);

  const handleSubmit = async (values) => {
    setSaving(true);
    try {
      chromaApi.setBaseUrl(values.serverUrl);
      setServerUrl(values.serverUrl);
      await login(values.token);
      await checkConnection();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Title level={2}>API 设置</Title>
      <Text type="secondary">配置 ChromaDB 服务器连接信息</Text>
      
      <Card style={{ marginTop: 24 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ 
            token: token,
            serverUrl: baseUrl || 'http://192.168.0.101:8000'
          }}
        >
          <Form.Item
            label="服务器地址"
            name="serverUrl"
            extra="ChromaDB 服务器地址"
          >
            <Input placeholder="http://192.168.0.101:8000" />
          </Form.Item>
          
          <Form.Item
            label="ChromaDB API Token"
            name="token"
            extra="可选。如无需认证可留空"
          >
            <Input.Password placeholder="请输入 API Token" />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={saving || loading}>
                保存并测试连接
              </Button>
            </Space>
          </Form.Item>
        </Form>

        {error && (
          <Alert
            title="连接失败"
            description={error}
            type="error"
            showIcon
            icon={<CloseCircleOutlined />}
            style={{ marginTop: 16 }}
          />
        )}

        {connected && !error && (
          <Alert
            title="连接成功"
            description="已成功连接到 ChromaDB 服务器"
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
            style={{ marginTop: 16 }}
          />
        )}

        {identity && (
          <Card size="small" style={{ marginTop: 16 }}>
            <Text strong>当前身份信息:</Text>
            <div style={{ marginTop: 8 }}>
              <div>Tenant: {identity.tenant}</div>
              <div>Database: {identity.database}</div>
            </div>
          </Card>
        )}
      </Card>

      <Card style={{ marginTop: 24 }}>
        <Title level={4}>API 信息</Title>
        <Text>API 版本: v2</Text>
      </Card>
    </div>
  );
}

export default SettingsPage;
