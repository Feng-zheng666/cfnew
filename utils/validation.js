/**
 * 验证工具函数模块
 * 包含各种验证函数，如UUID格式验证、IP地址验证、域名验证等
 */

/**
 * 验证UUID格式
 * @param {string} str - 要验证的字符串
 * @returns {boolean} 是否为有效的UUID格式
 */
export function isValidFormat(str) {
    const userRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return userRegex.test(str);
}

/**
 * 验证IP地址（IPv4和IPv6）
 * @param {string} ip - 要验证的IP地址
 * @returns {boolean} 是否为有效的IP地址
 */
export function isValidIP(ip) {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (ipv4Regex.test(ip)) return true;
    
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    if (ipv6Regex.test(ip)) return true;
    
    const ipv6ShortRegex = /^::1$|^::$|^(?:[0-9a-fA-F]{1,4}:)*::(?:[0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}$/;
    if (ipv6ShortRegex.test(ip)) return true;
    
    return false;
}

/**
 * 验证域名格式
 * @param {string} domain - 要验证的域名
 * @returns {boolean} 是否为有效的域名格式
 */
export function isValidDomain(domain) {
    const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    return domainRegex.test(domain);
}

/**
 * 解析地址和端口
 * @param {string} input - 输入的地址字符串，格式如 "1.2.3.4:443" 或 "[2001:db8::1]:443"
 * @returns {Object} 包含address和port的对象
 */
export function parseAddressAndPort(input) {
    if (input.includes('[') && input.includes(']')) {
        const match = input.match(/^\[([^\]]+)\](?::(\d+))?$/);
        if (match) {
            return {
                address: match[1],
                port: match[2] ? parseInt(match[2], 10) : null
            };
        }
    }
    
    const lastColonIndex = input.lastIndexOf(':');
    if (lastColonIndex > 0) {
        const address = input.substring(0, lastColonIndex);
        const portStr = input.substring(lastColonIndex + 1);
        const port = parseInt(portStr, 10);
        
        if (!isNaN(port) && port > 0 && port <= 65535) {
            return { address, port };
        }
    }
    
    return { address: input, port: null };
}

/**
 * 将数组转换为yx格式字符串
 * @param {Array} ipArray - 优选IP数组
 * @param {Array} domainArray - 优选域名数组
 * @returns {string} yx格式字符串
 */
export function arrayToYx(ipArray, domainArray) {
    const items = [];
    
    if (ipArray && ipArray.length > 0) {
        ipArray.forEach(item => {
            const port = item.port || 443;
            const name = item.isp || item.name || `优选IP-${item.ip}:${port}`;
            items.push(`${item.ip}:${port}#${name}`);
        });
    }
    
    if (domainArray && domainArray.length > 0) {
        domainArray.forEach(item => {
            const port = item.port || 443;
            const name = item.name || `优选域名-${item.domain}:${port}`;
            items.push(`${item.domain}:${port}#${name}`);
        });
    }
    
    return items.join(',');
}

/**
 * 将yx格式字符串解析为数组
 * @param {string} yxValue - yx格式字符串
 * @returns {Object} 包含ips和domains的对象
 */
export function parseYxToArray(yxValue) {
    if (!yxValue || !yxValue.trim()) {
        return { ips: [], domains: [] };
    }
    
    const items = yxValue.split(',').map(item => item.trim()).filter(item => item);
    const ips = [];
    const domains = [];
    
    for (const item of items) {
        let nodeName = '';
        let addressPart = item;
        
        if (item.includes('#')) {
            const parts = item.split('#');
            addressPart = parts[0].trim();
            nodeName = parts[1].trim();
        }
        
        const { address, port } = parseAddressAndPort(addressPart);
        
        if (!nodeName) {
            nodeName = address + (port ? ':' + port : '');
        }
        
        if (isValidIP(address)) {
            ips.push({
                ip: address,
                port: port || 443,
                isp: nodeName,
                addedAt: new Date().toISOString()
            });
        } else {
            domains.push({
                domain: address,
                port: port || 443,
                name: nodeName,
                addedAt: new Date().toISOString()
            });
        }
    }
    
    return { ips, domains };
}

/**
 * 格式化标识符
 * @param {string} identifier - 标识符
 * @returns {string} 格式化后的标识符
 */
export function formatIdentifier(identifier) {
    if (!identifier) return '';
    return identifier.toLowerCase().trim();
}

/**
 * Base64字符串转换为Uint8Array
 * @param {string} base64 - Base64字符串
 * @returns {Uint8Array} 转换后的Uint8Array
 */
export function base64ToArray(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

/**
 * 安静地关闭socket连接
 * @param {any} socket - socket连接
 */
export function closeSocketQuietly(socket) {
    if (socket && typeof socket.close === 'function') {
        try {
            socket.close();
        } catch (error) {
            // 安静地失败
        }
    }
}

/**
 * 解析SOCKS5配置
 * @param {string} configStr - SOCKS5配置字符串
 * @returns {Object} 解析后的配置对象
 */
export function parseSocksConfig(configStr) {
    if (!configStr || !configStr.trim()) {
        return {};
    }
    
    try {
        const parts = configStr.split(':');
        if (parts.length >= 2) {
            const host = parts[0];
            const port = parseInt(parts[1], 10);
            const username = parts.length > 2 ? parts[2] : '';
            const password = parts.length > 3 ? parts[3] : '';
            
            return {
                host,
                port: isNaN(port) ? 1080 : port,
                username,
                password,
                isValid: true
            };
        }
    } catch (error) {
        console.error('解析SOCKS配置失败:', error);
    }
    
    return { isValid: false };
}

/**
 * SHA224哈希函数（简化版）
 * @param {string} str - 输入字符串
 * @returns {string} 哈希值
 */
export function sha224Hash(str) {
    // 简化实现，实际应用中应使用完整的SHA224算法
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * 右旋转操作
 * @param {number} value - 要旋转的值
 * @param {number} shift - 旋转位数
 * @returns {number} 旋转后的值
 */
export function rightRotate(value, shift) {
    return (value >>> shift) | (value << (32 - shift));
}

/**
 * IP地址转换为十六进制
 * @param {string} ip - IP地址
 * @returns {string} 十六进制表示
 */
export function ipToHex(ip) {
    if (!isValidIP(ip)) return '';
    
    if (ip.includes(':')) {
        // IPv6地址
        return ip.split(':').map(part => part.padStart(4, '0')).join('');
    } else {
        // IPv4地址
        return ip.split('.').map(part => parseInt(part, 10).toString(16).padStart(2, '0')).join('');
    }
}

/**
 * 获取colo名称
 * @param {string} coloCode - colo代码
 * @returns {string} colo名称
 */
export function getColoName(coloCode) {
    const coloMap = {
        'AMS': '阿姆斯特丹',
        'ARN': '斯德哥尔摩',
        'ATL': '亚特兰大',
        'BKK': '曼谷',
        'BOM': '孟买',
        'CDG': '巴黎',
        'DFW': '达拉斯',
        'FRA': '法兰克福',
        'GRU': '圣保罗',
        'HKG': '香港',
        'IAD': '华盛顿',
        'ICN': '首尔',
        'JNB': '约翰内斯堡',
        'LAX': '洛杉矶',
        'LHR': '伦敦',
        'MAD': '马德里',
        'MIA': '迈阿密',
        'MXP': '米兰',
        'NRT': '东京',
        'ORD': '芝加哥',
        'SEA': '西雅图',
        'SFO': '旧金山',
        'SIN': '新加坡',
        'SYD': '悉尼',
        'TYO': '东京',
        'WAW': '华沙',
        'YYZ': '多伦多'
    };
    
    return coloMap[coloCode] || coloCode;
}

/**
 * 解析文本为数组
 * @param {string} text - 文本内容
 * @returns {Array} 解析后的数组
 */
export function parseTextToArray(text) {
    if (!text) return [];
    
    return text.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#') && !line.startsWith('//'))
        .map(line => {
            const parts = line.split(/\s+/);
            return {
                address: parts[0],
                port: parts[1] ? parseInt(parts[1], 10) : 443,
                comment: parts.slice(2).join(' ') || ''
            };
        });
}

/**
 * 获取优选API
 * @param {string} apiUrl - API URL
 * @returns {Promise<Array>} 优选IP列表
 */
export async function fetchPreferredAPI(apiUrl) {
    try {
        const response = await fetch(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; CF-IP-Fetcher/1.0)'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP错误: ${response.status}`);
        }
        
        const text = await response.text();
        return parseTextToArray(text);
    } catch (error) {
        console.error('获取优选API失败:', error);
        return [];
    }
}
