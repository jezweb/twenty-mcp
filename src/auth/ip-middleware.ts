import { IncomingMessage, ServerResponse } from 'node:http';
import { isIP } from 'node:net';

export interface IPConfig {
  enabled: boolean;
  allowlist: string[];
  blockUnknown: boolean;
  trustedProxies: string[];
}

export class IPMiddleware {
  private config: IPConfig;
  
  constructor() {
    this.config = this.parseConfig();
  }
  
  private parseConfig(): IPConfig {
    return {
      enabled: process.env.IP_PROTECTION_ENABLED === 'true',
      allowlist: this.parseIPList(process.env.IP_ALLOWLIST || ''),
      blockUnknown: process.env.IP_BLOCK_UNKNOWN !== 'false',
      trustedProxies: this.parseIPList(process.env.TRUSTED_PROXIES || ''),
    };
  }
  
  private parseIPList(ipList: string): string[] {
    return ipList
      .split(',')
      .map(ip => ip.trim())
      .filter(ip => ip.length > 0);
  }
  
  private getClientIP(req: IncomingMessage): string | null {
    const headers = req.headers;
    
    // Check forwarded headers if we have trusted proxies
    if (this.config.trustedProxies.length > 0) {
      const forwardedFor = headers['x-forwarded-for'] as string;
      if (forwardedFor) {
        const ips = forwardedFor.split(',').map(ip => ip.trim());
        return ips[0] || null;
      }
      
      const realIP = headers['x-real-ip'] as string;
      if (realIP) {
        return realIP.trim();
      }
    }
    
    // Fallback to socket remote address
    return req.socket.remoteAddress || null;
  }
  
  private isIPInCIDR(ip: string, cidr: string): boolean {
    // Handle single IP addresses
    if (!cidr.includes('/')) {
      return ip === cidr;
    }
    
    const [network, prefixLength] = cidr.split('/');
    const prefix = parseInt(prefixLength, 10);
    
    if (isNaN(prefix)) {
      return false;
    }
    
    // Determine IP version
    const ipVersion = isIP(ip);
    const networkVersion = isIP(network);
    
    if (ipVersion === 0 || networkVersion === 0 || ipVersion !== networkVersion) {
      return false;
    }
    
    if (ipVersion === 4) {
      return this.isIPv4InCIDR(ip, network, prefix);
    } else {
      return this.isIPv6InCIDR(ip, network, prefix);
    }
  }
  
  private isIPv4InCIDR(ip: string, network: string, prefix: number): boolean {
    if (prefix < 0 || prefix > 32) {
      return false;
    }
    
    const ipParts = ip.split('.').map(Number);
    const networkParts = network.split('.').map(Number);
    
    if (ipParts.length !== 4 || networkParts.length !== 4) {
      return false;
    }
    
    const ipNum = (ipParts[0] << 24) + (ipParts[1] << 16) + (ipParts[2] << 8) + ipParts[3];
    const networkNum = (networkParts[0] << 24) + (networkParts[1] << 16) + (networkParts[2] << 8) + networkParts[3];
    const mask = prefix === 0 ? 0 : -1 << (32 - prefix);
    
    return (ipNum & mask) === (networkNum & mask);
  }
  
  private isIPv6InCIDR(ip: string, network: string, prefix: number): boolean {
    if (prefix < 0 || prefix > 128) {
      return false;
    }
    
    // Expand IPv6 addresses to full form
    const expandedIP = this.expandIPv6(ip);
    const expandedNetwork = this.expandIPv6(network);
    
    if (!expandedIP || !expandedNetwork) {
      return false;
    }
    
    const bitsToCheck = Math.floor(prefix / 16);
    const remainingBits = prefix % 16;
    
    const ipParts = expandedIP.split(':');
    const networkParts = expandedNetwork.split(':');
    
    // Check full 16-bit segments
    for (let i = 0; i < bitsToCheck; i++) {
      if (ipParts[i] !== networkParts[i]) {
        return false;
      }
    }
    
    // Check remaining bits in the next segment
    if (remainingBits > 0 && bitsToCheck < 8) {
      const ipSegment = parseInt(ipParts[bitsToCheck], 16);
      const networkSegment = parseInt(networkParts[bitsToCheck], 16);
      const mask = 0xFFFF << (16 - remainingBits);
      
      if ((ipSegment & mask) !== (networkSegment & mask)) {
        return false;
      }
    }
    
    return true;
  }
  
  private expandIPv6(ip: string): string | null {
    try {
      // Handle :: expansion
      if (ip.includes('::')) {
        const parts = ip.split('::');
        if (parts.length !== 2) {
          return null;
        }
        
        const leftParts = parts[0] ? parts[0].split(':') : [];
        const rightParts = parts[1] ? parts[1].split(':') : [];
        const missingParts = 8 - leftParts.length - rightParts.length;
        
        const expanded = [
          ...leftParts,
          ...Array(missingParts).fill('0000'),
          ...rightParts
        ];
        
        return expanded.map(part => part.padStart(4, '0')).join(':');
      } else {
        // Already expanded or single segments
        const parts = ip.split(':');
        if (parts.length !== 8) {
          return null;
        }
        return parts.map(part => part.padStart(4, '0')).join(':');
      }
    } catch {
      return null;
    }
  }
  
  private isIPAllowed(ip: string): boolean {
    // Always allow localhost/loopback
    if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') {
      return true;
    }
    
    // Check against allowlist
    for (const allowedIP of this.config.allowlist) {
      if (this.isIPInCIDR(ip, allowedIP)) {
        return true;
      }
    }
    
    return false;
  }
  
  async checkAccess(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
    // Skip if IP protection is disabled
    if (!this.config.enabled) {
      return true;
    }
    
    const clientIP = this.getClientIP(req);
    
    if (!clientIP) {
      if (this.config.blockUnknown) {
        this.sendForbidden(res, 'Unable to determine client IP address');
        return false;
      }
      return true;
    }
    
    // Validate IP format
    if (isIP(clientIP) === 0) {
      this.sendForbidden(res, 'Invalid IP address format');
      return false;
    }
    
    // Check if IP is allowed
    if (!this.isIPAllowed(clientIP)) {
      this.sendForbidden(res, `Access denied for IP: ${clientIP}`);
      return false;
    }
    
    return true;
  }
  
  private sendForbidden(res: ServerResponse, message: string): void {
    res.writeHead(403, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    });
    res.end(JSON.stringify({
      error: 'forbidden',
      error_description: message,
    }));
  }
  
  getConfig(): IPConfig {
    return { ...this.config };
  }
  
  updateConfig(newConfig: Partial<IPConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}