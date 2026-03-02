import { useState } from 'react';
import { Layout, Menu, theme, Button, Space, Typography, Badge, Card } from 'antd';
import {
  HomeOutlined,
  DatabaseOutlined,
  FolderOutlined,
  TableOutlined,
  SettingOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const { Header, Content, Sider } = Layout;
const { Text } = Typography;

function AppLayout() {
  const location = useLocation();
  const { token, connected, identity, logout } = useAuth();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: <Link to="/">概览</Link>,
    },
    {
      key: '/databases',
      icon: <DatabaseOutlined />,
      label: <Link to="/databases">数据库</Link>,
    },
    {
      key: '/collections',
      icon: <FolderOutlined />,
      label: <Link to="/collections">集合</Link>,
    },
    {
      key: '/records',
      icon: <TableOutlined />,
      label: <Link to="/records">记录</Link>,
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: <Link to="/settings">设置</Link>,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
        <Space>
          <ApiOutlined style={{ fontSize: 24, color: '#fff' }} />
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>ChromaDB 管理</Text>
        </Space>
        <Space>
          {connected && (
            <Badge status="success" text={<Text style={{ color: '#fff' }}>已连接</Text>} />
          )}
          {identity && (
            <Text style={{ color: '#fff' }}>
              {identity.tenant}/{identity.database}
            </Text>
          )}
          <Button type="text" danger onClick={logout} style={{ color: '#fff' }}>
            退出
          </Button>
        </Space>
      </Header>
      <Layout>
        <Sider width={200} style={{ background: colorBgContainer }}>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
          />
        </Sider>
        <Layout style={{ padding: '24px' }}>
          <Content
            style={{
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
              minHeight: 280,
            }}
          >
            <div style={{ padding: 24, minHeight: 280 }}>
              <Outlet />
            </div>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}

export default AppLayout;
