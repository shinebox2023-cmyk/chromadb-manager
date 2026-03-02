import { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Typography, Modal, Form, Input, message, Popconfirm, Alert } from 'antd';
import { PlusOutlined, DeleteOutlined, DatabaseOutlined } from '@ant-design/icons';
import chromaApi from '../api/chromaApi';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

function DatabasesPage() {
  const { connected, identity } = useAuth();
  const [loading, setLoading] = useState(false);
  const [databases, setDatabases] = useState([]);
  const [createModal, setCreateModal] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (connected && identity) {
      loadDatabases();
    }
  }, [connected, identity]);

  const loadDatabases = async () => {
    setLoading(true);
    try {
      const dbs = await chromaApi.getDatabases(identity.tenant);
      setDatabases(dbs);
    } catch (e) {
      message.error('加载数据库失败: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values) => {
    try {
      await chromaApi.createDatabase(identity.tenant, values.name);
      message.success('数据库创建成功');
      setCreateModal(false);
      form.resetFields();
      loadDatabases();
    } catch (e) {
      message.error('创建失败: ' + e.message);
    }
  };

  const handleDelete = async (dbName) => {
    try {
      await chromaApi.deleteDatabase(identity.tenant, dbName);
      message.success('数据库删除成功');
      loadDatabases();
    } catch (e) {
      message.error('删除失败: ' + e.message);
    }
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <Space><DatabaseOutlined />{text}</Space>,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (ts) => ts ? new Date(ts / 1000000).toLocaleString() : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Popconfirm
            title="确定删除此数据库?"
            description="删除后无法恢复"
            onConfirm={() => handleDelete(record.name)}
            okText="确定"
            cancelText="取消"
          >
            <Button danger size="small" icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (!connected) {
    return (
      <Alert
        title="未连接"
        description="请先在设置页面配置 ChromaDB API Token"
        type="warning"
        showIcon
      />
    );
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>数据库</Title>
        <Text type="secondary">当前租户: {identity?.tenant}</Text>
      </Space>

      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModal(true)}
          >
            创建数据库
          </Button>
          <Button onClick={loadDatabases}>刷新</Button>
        </Space>

        <Table
          columns={columns}
          dataSource={databases}
          loading={loading}
          rowKey="name"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="创建数据库"
        open={createModal}
        onCancel={() => {
          setCreateModal(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            label="数据库名称"
            name="name"
            rules={[{ required: true, message: '请输入数据库名称' }]}
          >
            <Input placeholder="请输入数据库名称" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                创建
              </Button>
              <Button onClick={() => setCreateModal(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default DatabasesPage;
