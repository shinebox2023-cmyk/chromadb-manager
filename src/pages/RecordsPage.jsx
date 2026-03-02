import { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Flex, Form, Input, Select, message, Tag, Row, Col, InputNumber, Alert, Modal, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined, EditOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import chromaApi from '../api/chromaApi';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;
const TextArea = Input.TextArea;

function RecordsPage() {
  const { connected, identity } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [databases, setDatabases] = useState([]);
  const [collections, setCollections] = useState([]);
  const [selectedDb, setSelectedDb] = useState(null);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [total, setTotal] = useState(0);
  
  const [addModal, setAddModal] = useState(false);
  const [queryModal, setQueryModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [form] = Form.useForm();
  const [queryForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [editingRecord, setEditingRecord] = useState(null);

  // Initialize from navigation state
  useEffect(() => {
    if (location.state) {
      if (location.state.database) setSelectedDb(location.state.database);
      if (location.state.collection) setSelectedCollection(location.state.collection);
    }
  }, [location.state]);

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

  useEffect(() => {
    if (selectedDb && selectedCollection) {
      loadRecords();
    }
  }, [selectedDb, selectedCollection]);

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
    try {
      const cols = await chromaApi.getCollections(identity.tenant, dbName);
      setCollections(cols);
      if (cols.length > 0 && !selectedCollection) {
        // Check if current collection still exists
        const currentExists = cols.find(c => c.id === selectedCollection?.id || c.name === selectedCollection?.name);
        if (currentExists) {
          setSelectedCollection(currentExists);
        } else {
          setSelectedCollection(cols[0]);
        }
      }
    } catch (e) {
      message.error('加载集合列表失败: ' + e.message);
    }
  };

  const loadRecords = async (options = {}) => {
    if (!selectedDb || !selectedCollection) return;
    
    setLoading(true);
    try {
      const query = {
        limit: options.limit || 20,
        offset: options.offset || 0,
        include: ['documents', 'metadatas', 'embeddings'],
      };
      
      const result = await chromaApi.getRecords(identity.tenant, selectedDb, selectedCollection.id, query);
      
      const formattedRecords = (result.ids || []).map((id, idx) => ({
        id,
        document: result.documents?.[idx] || '',
        metadata: result.metadatas?.[idx] || {},
        embedding: result.embeddings?.[idx] || null,
      }));
      
      setRecords(formattedRecords);
      setTotal(result.total || formattedRecords.length);
    } catch (e) {
      message.error('加载记录失败: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (values) => {
    if (!selectedDb || !selectedCollection) return;
    
    try {
      const record = {};
      
      // Only add id if provided
      if (values.id) {
        record.ids = [values.id];
      } else {
        record.ids = [`doc_${Date.now()}`];
      }
      
      // Only add document if provided
      if (values.document) {
        record.documents = [values.document];
      }
      
      // Only add metadata if provided and valid JSON
      if (values.metadata) {
        try {
          record.metadatas = [JSON.parse(values.metadata)];
        } catch (e) {
          message.error('元数据 JSON 格式错误');
          return;
        }
      }
      
      // Only add embeddings if provided
      if (values.embedding) {
        const embArray = values.embedding.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
        if (embArray.length > 0) {
          record.embeddings = [embArray];
        }
      }
      
      await chromaApi.addRecords(identity.tenant, selectedDb, selectedCollection.id, record);
      message.success('记录添加成功');
      setAddModal(false);
      form.resetFields();
      loadRecords();
    } catch (e) {
      message.error('添加失败: ' + e.message);
    }
  };

  const handleUpdate = async (values) => {
    if (!selectedDb || !selectedCollection || !editingRecord) return;
    
    try {
      const updates = {
        ids: [editingRecord.id],
      };
      
      if (values.document) {
        updates.documents = [values.document];
      }
      
      if (values.metadata) {
        try {
          updates.metadatas = [JSON.parse(values.metadata)];
        } catch (e) {
          message.error('元数据 JSON 格式错误');
          return;
        }
      }
      
      await chromaApi.updateRecords(identity.tenant, selectedDb, selectedCollection.id, updates);
      message.success('记录更新成功');
      setEditModal(false);
      setEditingRecord(null);
      editForm.resetFields();
      loadRecords();
    } catch (e) {
      message.error('更新失败: ' + e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!selectedDb || !selectedCollection) return;
    
    try {
      await chromaApi.deleteRecords(identity.tenant, selectedDb, selectedCollection.id, { ids: [id] });
      message.success('记录删除成功');
      loadRecords();
    } catch (e) {
      message.error('删除失败: ' + e.message);
    }
  };

  const handleQuery = async (values) => {
    if (!selectedDb || !selectedCollection) return;
    
    setLoading(true);
    try {
      const query = {
        query_texts: values.queryText ? [values.queryText] : undefined,
        query_embeddings: values.queryEmbedding ? values.queryEmbedding.split(',').map(Number) : undefined,
        n_results: values.nResults || 10,
        where: values.filter ? JSON.parse(values.filter) : undefined,
        include: ['documents', 'metadatas', 'distances'],
      };
      
      const result = await chromaApi.queryRecords(identity.tenant, selectedDb, selectedCollection.id, query);
      
      const formattedRecords = (result.ids?.[0] || []).map((id, idx) => ({
        id,
        document: result.documents?.[0]?.[idx] || '',
        metadata: result.metadatas?.[0]?.[idx] || {},
        distance: result.distances?.[0]?.[idx],
      }));
      
      setRecords(formattedRecords);
      setTotal(formattedRecords.length);
      setQueryModal(false);
      queryForm.resetFields();
    } catch (e) {
      message.error('搜索失败: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    editForm.setFieldsValue({
      id: record.id,
      document: record.document,
      metadata: JSON.stringify(record.metadata, null, 2),
    });
    setEditModal(true);
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 150,
      render: (id) => <Tag>{id.substring(0, 12)}...</Tag>,
    },
    {
      title: '文档内容',
      dataIndex: 'document',
      key: 'document',
      ellipsis: true,
      render: (doc) => doc || '-',
    },
    {
      title: '元数据',
      dataIndex: 'metadata',
      key: 'metadata',
      render: (meta) => (
        <Flex vertical gap={0}>
          {Object.entries(meta).slice(0, 3).map(([k, v]) => (
            <Tag key={k}>{k}: {String(v).substring(0, 20)}</Tag>
          ))}
          {Object.keys(meta).length > 3 && <Text type="secondary">+{Object.keys(meta).length - 3} more</Text>}
        </Flex>
      ),
    },
    {
      title: '距离分数',
      dataIndex: 'distance',
      key: 'distance',
      render: (d) => d !== undefined ? d.toFixed(4) : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)}>
            编辑
          </Button>
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  if (!connected) {
    return (
      <Alert
        message="未连接"
        description="请先在设置页面配置 ChromaDB API Token"
        type="warning"
        showIcon
      />
    );
  }

  return (
    <div>
      <Flex vertical gap="middle" style={{ width: '100%' }}>
        <Title level={2} style={{ margin: 0 }}>记录</Title>
        
        <Row gutter={16}>
          <Col span={8}>
            <Select
              style={{ width: '100%' }}
              value={selectedDb}
              onChange={(val) => {
                setSelectedDb(val);
                setSelectedCollection(null);
                setRecords([]);
              }}
              placeholder="选择数据库"
              options={databases.map(db => ({ label: db.name, value: db.name }))}
            />
          </Col>
          <Col span={8}>
            <Select
              style={{ width: '100%' }}
              value={selectedCollection?.id}
              onChange={(val) => {
                const col = collections.find(c => c.id === val);
                setSelectedCollection(col);
              }}
              placeholder="选择集合"
              options={collections.map(c => ({ label: c.name, value: c.id }))}
              disabled={!selectedDb}
            />
          </Col>
          <Col span={8}>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setAddModal(true)}
                disabled={!selectedCollection}
              >
                添加
              </Button>
              <Button
                icon={<SearchOutlined />}
                onClick={() => setQueryModal(true)}
                disabled={!selectedCollection}
              >
                向量搜索
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => loadRecords()}
                disabled={!selectedCollection}
              >
                刷新
              </Button>
            </Space>
          </Col>
        </Row>
      </Flex>

      <Card style={{ marginTop: 16 }}>
        <Table
          columns={columns}
          dataSource={records}
          loading={loading}
          rowKey="id"
          pagination={{ 
            pageSize: 20,
            total: total,
            onChange: (page, pageSize) => {
              loadRecords({ offset: (page - 1) * pageSize, limit: pageSize });
            }
          }}
          expandable={{
            expandedRowRender: (record) => (
              <Card size="small">
                <Flex vertical style={{ width: '100%' }}>
                  <div>
                    <Text strong>完整文档:</Text>
                    <pre style={{ maxHeight: 200, overflow: 'auto' }}>
                      {record.document || '(无)'}
                    </pre>
                  </div>
                  <div>
                    <Text strong>完整元数据:</Text>
                    <pre style={{ maxHeight: 200, overflow: 'auto' }}>
                      {JSON.stringify(record.metadata, null, 2) || '(无)'}
                    </pre>
                  </div>
                  {record.embedding && (
                    <div>
                      <Text strong>向量维度:</Text>
                      <Tag>{record.embedding.length}</Tag>
                      <Text type="secondary" style={{ marginLeft: 8 }}>
                        [{record.embedding.slice(0, 5).join(', ')}...]
                      </Text>
                    </div>
                  )}
                </Flex>
              </Card>
            ),
          }}
        />
      </Card>

      {/* Add Record Modal */}
      <Modal
        title="添加记录"
        open={addModal}
        onCancel={() => {
          setAddModal(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <Form.Item label="记录ID (可选)" name="id">
            <Input placeholder="留空则自动生成" />
          </Form.Item>
          <Form.Item 
            label="文档内容" 
            name="document"
            rules={[{ required: true, message: '请输入文档内容' }]}
          >
            <TextArea rows={4} placeholder="请输入文档内容" />
          </Form.Item>
          <Form.Item label="元数据 (JSON)" name="metadata">
            <TextArea rows={3} placeholder='{"key": "value"}' />
          </Form.Item>
          <Form.Item label="向量 (逗号分隔的浮点数)" name="embedding">
            <Input placeholder="0.1, 0.2, 0.3, ..." />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                添加
              </Button>
              <Button onClick={() => setAddModal(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Query Modal */}
      <Modal
        title="向量搜索"
        open={queryModal}
        onCancel={() => {
          setQueryModal(false);
          queryForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={queryForm} layout="vertical" onFinish={handleQuery}>
          <Form.Item label="搜索文本" name="queryText">
            <Input placeholder="输入搜索文本" />
          </Form.Item>
          <Form.Item label="或 向量" name="queryEmbedding">
            <Input placeholder="0.1, 0.2, 0.3, ..." />
          </Form.Item>
          <Form.Item label="返回数量" name="nResults" initialValue={10}>
            <InputNumber min={1} max={100} />
          </Form.Item>
          <Form.Item label="元数据过滤 (JSON)" name="filter">
            <TextArea rows={2} placeholder='{"key": "value"}' />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                搜索
              </Button>
              <Button onClick={() => setQueryModal(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        title="编辑记录"
        open={editModal}
        onCancel={() => {
          setEditModal(false);
          setEditingRecord(null);
          editForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={editForm} layout="vertical" onFinish={handleUpdate}>
          <Form.Item label="记录ID" name="id">
            <Input disabled />
          </Form.Item>
          <Form.Item label="文档内容" name="document">
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item label="元数据 (JSON)" name="metadata">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
              <Button onClick={() => setEditModal(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default RecordsPage;
