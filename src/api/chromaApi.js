// ChromaDB API Service
// Use proxy in development: requests to /api/* will be forwarded to ChromaDB server

class ChromaDBApi {
  constructor() {
    this.token = localStorage.getItem('chroma_token') || '';
    this.baseUrl = localStorage.getItem('chroma_base_url') || '';
  }

  setBaseUrl(url) {
    this.baseUrl = url || '';
    if (url) {
      localStorage.setItem('chroma_base_url', url);
    }
  }

  getBaseUrl() {
    return this.baseUrl;
  }

  setToken(token) {
    this.token = token || '';
    localStorage.setItem('chroma_token', this.token);
  }

  getToken() {
    return this.token;
  }

  clearToken() {
    this.token = '';
    localStorage.removeItem('chroma_token');
  }

  clearBaseUrl() {
    this.baseUrl = '';
    localStorage.removeItem('chroma_base_url');
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['x-chroma-token'] = this.token;
    }
    return headers;
  }

  // Use relative path - Vite proxy will forward to ChromaDB server
  async request(method, endpoint, data = null, timeout = 30000) {
    const options = {
      method,
      headers: this.getHeaders(),
      signal: timeout ? AbortSignal.timeout(timeout) : undefined,
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    // In development, always use proxy (/api) to avoid CORS
    // In production, use custom baseUrl if set
    const isDev = import.meta.env.MODE === 'development';
    const base = (isDev || !this.baseUrl) ? '/api' : this.baseUrl;
    const response = await fetch(`${base}${endpoint}`, options);
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || `HTTP ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return response.text();
  }

  // Health check
  async healthcheck() {
    return this.request('GET', '/healthcheck');
  }

  async heartbeat() {
    return this.request('GET', '/heartbeat');
  }

  async version() {
    return this.request('GET', '/version');
  }

  // Auth
  async getAuthIdentity() {
    return this.request('GET', '/auth/identity');
  }

  // Tenant operations
  async getTenants() {
    const identity = await this.getAuthIdentity();
    return [identity.tenant];
  }

  async getTenant(tenantName) {
    return this.request('GET', `/tenants/${tenantName}`);
  }

  async createTenant(tenantName) {
    return this.request('POST', '/tenants', { name: tenantName });
  }

  // Database operations
  async getDatabases(tenant) {
    return this.request('GET', `/tenants/${tenant}/databases`);
  }

  async getDatabase(tenant, database) {
    return this.request('GET', `/tenants/${tenant}/databases/${database}`);
  }

  async createDatabase(tenant, database) {
    return this.request('POST', `/tenants/${tenant}/databases`, { name: database });
  }

  async deleteDatabase(tenant, database) {
    return this.request('DELETE', `/tenants/${tenant}/databases/${database}`);
  }

  // Collection operations
  async getCollections(tenant, database) {
    return this.request('GET', `/tenants/${tenant}/databases/${database}/collections`);
  }

  async getCollection(tenant, database, collectionIdOrName) {
    try {
      return this.request('GET', `/tenants/${tenant}/databases/${database}/collections/${collectionIdOrName}`);
    } catch (e) {
      const crn = `${tenant}:${database}:${collectionIdOrName}`;
      return this.request('GET', `/collections/${crn}`);
    }
  }

  async createCollection(tenant, database, name, options = {}) {
    return this.request('POST', `/tenants/${tenant}/databases/${database}/collections`, {
      name,
      ...options,
    });
  }

  async updateCollection(tenant, database, collectionId, data) {
    return this.request('PUT', `/tenants/${tenant}/databases/${database}/collections/${collectionId}`, data);
  }

  async deleteCollection(tenant, database, collectionId) {
    return this.request('DELETE', `/tenants/${tenant}/databases/${database}/collections/${collectionId}`);
  }

  async getCollectionsCount(tenant, database) {
    return this.request('GET', `/tenants/${tenant}/databases/${database}/collections_count`);
  }

  // Record operations
  async getRecords(tenant, database, collectionId, options = {}) {
    return this.request('POST', `/tenants/${tenant}/databases/${database}/collections/${collectionId}/get`, options);
  }

  async queryRecords(tenant, database, collectionId, query) {
    return this.request('POST', `/tenants/${tenant}/databases/${database}/collections/${collectionId}/query`, query);
  }

  async addRecords(tenant, database, collectionId, records) {
    return this.request('POST', `/tenants/${tenant}/databases/${database}/collections/${collectionId}/add`, records);
  }

  async upsertRecords(tenant, database, collectionId, records) {
    return this.request('POST', `/tenants/${tenant}/databases/${database}/collections/${collectionId}/upsert`, records);
  }

  async updateRecords(tenant, database, collectionId, updates) {
    return this.request('POST', `/tenants/${tenant}/databases/${database}/collections/${collectionId}/update`, updates);
  }

  async deleteRecords(tenant, database, collectionId, options = {}) {
    return this.request('POST', `/tenants/${tenant}/databases/${database}/collections/${collectionId}/delete`, options);
  }

  async getRecordsCount(tenant, database, collectionId) {
    return this.request('GET', `/tenants/${tenant}/databases/${database}/collections/${collectionId}/count`);
  }

  async getIndexingStatus(tenant, database, collectionId) {
    return this.request('GET', `/tenants/${tenant}/databases/${database}/collections/${collectionId}/indexing_status`);
  }

  // Reset
  async reset() {
    return this.request('POST', '/reset');
  }
}

export const chromaApi = new ChromaDBApi();
export default chromaApi;
