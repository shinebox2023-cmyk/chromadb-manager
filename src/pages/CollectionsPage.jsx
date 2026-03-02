import { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Flex, Typography, Modal, Form, Input, Select, message, Popconfirm, Alert, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined, FolderOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import chromaApi from '../api/chromaApi';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

function CollectionsPage() {
  const { connected, identity } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [collections, setCollections] = useState([]);
  const [databases, setDatabases] = useState([]);
  const [selectedDb, setSelectedDb] = useState(null);
  const [createModal, setCreateModal] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (connected && identity) {
      loadDatabases();
    }
  }, [connected, identity]);

  useEffect(() => {
    if (selectedDb) {
      loadCollections(selectedDb);
    }
  }, [selectedDb]);

  const loadDatabases = async () => {
    try {
      const dbs = await chromaApi.getDatabases(identity.tenant);
      setDatabases(dbs);
      if (dbs.length > 0 && !selectedDb) {
        setSelectedDb(dbs[0].name);
      }
    } catch (e) {
      message.error('加载数据库列表失败: ' + e.message);
    }
  };

  const loadCollections = async (dbName) => {
    setLoading(true);
    try {
      const cols = await chromaApi.getCollections(identity.tenant, dbName);
      // Load count for each collection
      const colsWithCount = await Promise.all(
        cols.map(async (col) => {
          try {
            const count = await chromaApi.getRecordsCount(identity.tenant, dbName, col.id);
            return { ...col, recordCount: count };
          } catch (e) {
            return { ...col, recordCount: 0 };
          }
        })
      );
      setCollections(colsWithCount);
    } catch (e) {
      message.error('加载集合失败: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values) => {
    try {
      const options = {};
      if (values.get('metadata')) {
        options.metadata = JSON.parse(values.get('metadata'));
      }
      await chromaApi.createCollection(identity.tenant, selectedDb, values.name, options);
      message.success('集合创建成功');
      setCreateModal(false);
      form.resetFields();
      loadCollections(selectedDb);
    } catch (e) {
      message.error('创建失败: ' + e.message);
    }
  };

  const handleDelete = async (collectionId) => {
    try {
      await chromaApi.deleteCollection(identity.tenant, selectedDb, collectionId);
      message.success('集合删除成功');
      loadCollections(selectedDb);
    } catch (e) {
      message.error('删除失败: ' + e.message);
    }
  };

  const viewRecords = (collection) => {
    navigate('/records', { state: { database: selectedDb, collection } });
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <Space><FolderOutlined />{text}</Space>,
    },
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      render: (id) => <Tag>{id.substring(0, 8)}...</Tag>,
    },
    {
      title: '记录数',
      dataIndex: 'recordCount',
      key: 'recordCount',
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
          <Button size="small" icon={<EyeOutlined />} onClick={() => viewRecords(record)}>
            查看
          </Button>
          <Popconfirm
            title="确定删除此集合?"
            description="删除后无法恢复"
            onConfirm={() => handleDelete(record.id)}
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
      <Flex vertical style={{ marginBottom: 16 }}>
        <Space>
          <Title level={2} style={{ margin: 0 }}>集合</Title>
          <Text type="secondary">选择数据库查看集合</Text>
        </Space>
        <Select
          style={{ width: 200 }}
          value={selectedDb}
          onChange={setSelectedDb}
          placeholder="选择数据库"
          options={databases.map(db => ({ label: db.name, value: db.name }))}
        />
      </Flex>

      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModal(true)}
            disabled={!selectedDb}
          >
            创建集合
          </Button>
          <Button onClick={() => loadCollections(selectedDb)} disabled={!selectedDb}>
            刷新
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={collections}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="创建集合"
        open={createModal}
        onCancel={() => {
          setCreateModal(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            label="集合名称"
            name="name"
            rules={[{ required: true, message: '请输入集合名称' }]}
          >
            <Input placeholder="请输入集合名称" />
          </Form.Item>
          <Form.Item
            label="元数据 (JSON)"
            name="metadata"
            extra="可选，格式: {&quot;key&quot;: &quot;value&quot;}"
          >
            <Input.TextArea placeholder='{"key": "value"}' rows={3} />
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

export default CollectionsPage;
