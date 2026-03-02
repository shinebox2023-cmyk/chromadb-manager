import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, Spin, Alert } from 'antd';
import { DatabaseOutlined, FolderOutlined, TableOutlined, ApiOutlined } from '@ant-design/icons';
import chromaApi from '../api/chromaApi';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

function OverviewPage() {
  const { connected, identity } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    tenants: 0,
    databases: 0,
    collections: 0,
    records: 0,
  });
  const [version, setVersion] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (connected && identity) {
      loadStats();
    }
  }, [connected, identity]);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const ver = await chromaApi.version();
      setVersion(ver);

      const identity = await chromaApi.getAuthIdentity();
      const databases = await chromaApi.getDatabases(identity.tenant);
      let totalCollections = 0;
      let totalRecords = 0;

      for (const db of databases) {
        try {
          const collections = await chromaApi.getCollections(identity.tenant, db.name);
          totalCollections += collections.length;
          
          for (const col of collections) {
            try {
              const count = await chromaApi.getRecordsCount(identity.tenant, db.name, col.id);
              totalRecords += count;
            } catch (e) {
              // Skip errors
            }
          }
        } catch (e) {
          // Skip errors
        }
      }

      setStats({
        tenants: 1,
        databases: databases.length,
        collections: totalCollections,
        records: totalRecords,
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

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
      <Title level={2}>概览</Title>
      <Text type="secondary">ChromaDB 数据库统计信息</Text>

      {error && (
        <Alert
          title="加载统计信息失败"
          description={error}
          type="error"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}

      <Spin spinning={loading}>
        <Row gutter={16} style={{ marginTop: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="服务器版本"
                value={version || '-'}
                prefix={<ApiOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="租户数"
                value={stats.tenants}
                prefix={<DatabaseOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="数据库数"
                value={stats.databases}
                prefix={<DatabaseOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="集合数"
                value={stats.collections}
                prefix={<FolderOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={24}>
            <Card>
              <Statistic
                title="总记录数"
                value={stats.records}
                prefix={<TableOutlined />}
                styles={{ content: { fontSize: 36 } }}
              />
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
}

export default OverviewPage;
