/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'operator' | 'viewer';

export interface NetworkInterface {
  id: string;
  name: string;
  type: 'fiber' | 'dsl' | 'lte' | 'starlink';
  status: 'online' | 'offline' | 'degraded';
  speedUp: number; // in Mbps
  speedDown: number; // in Mbps
  latency: number; // in ms
  loss: number; // percentage
  weight: number;
  priority: number;
  enabled: boolean;
  trackingIps: string[];
  uptime: number; // in seconds
  device: string; // e.g. eth0, pppoe-wan, usb0
}

export interface AlertLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  interfaceId?: string;
  message: string;
  resolved: boolean;
}

export interface APIToken {
  id: string;
  name: string;
  token: string;
  scope: 'read' | 'write' | 'admin';
  createdAt: string;
}

export interface UpdateFeed {
  id: string;
  type: 'security' | 'feature' | 'system';
  version: string;
  date: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  applied: boolean;
}

export interface DashboardWidget {
  id: string;
  titleEn: string;
  titleAr: string;
  visible: boolean;
  order: number;
}

export interface SystemMetrics {
  cpuUsage: number;
  ramUsage: number; // percentage
  temp: number; // Celsius
  activeConnections: number;
  mwan3Uptime: number;
}
